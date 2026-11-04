import type {
  EditorialConversationListData,
  EditorialConversationScope,
  EditorialConversationSummary,
  EditorialConversationUpdateRequest,
  EditorialWorkflowStatus,
  TeamMember,
} from "@newsplus/shared";
import { ValidationError } from "../utils/errors.js";
import { moveMessage } from "./editorialWorkflow.js";
import type { EditorialWorkspaceStore } from "./editorialWorkspaceStore.js";
import { toMemberRef, type TeamService } from "./teamService.js";

export type EditorialListQuery = {
  q?: string;
  scope?: EditorialConversationScope;
  status?: EditorialWorkflowStatus;
};

type EditorialWorkflowServiceDeps = {
  workspace: EditorialWorkspaceStore;
  team: TeamService;
};

function withAssignee(
  summary: EditorialConversationSummary,
  directory: Map<string, TeamMember>,
): EditorialConversationSummary {
  const member = directory.get(summary.assigneeId);
  return member ? { ...summary, assignee: toMemberRef(member) } : summary;
}

/** S15 «سير العمل»: the board's conversation list and the workflow update (status, assignee, platforms). */
export class EditorialWorkflowService {
  constructor(private readonly deps: EditorialWorkflowServiceDeps) {}

  /**
   * `GET /editorial/conversations`. Without `scope`/`status` the items are the pre-S15 list (same search, order and
   * page) with the new fields and the assignee added. `counts` is only returned when `scope` or `status` is given.
   */
  async list(query: EditorialListQuery, userId: string): Promise<EditorialConversationListData> {
    const directory = await this.deps.team.directory();
    const filter = { scope: query.scope, status: query.status, userId };
    const items = this.deps.workspace
      .listConversations(query.q, filter)
      .map((summary) => withAssignee(summary, directory));
    if (!query.scope && !query.status) return { items };
    return { items, counts: this.deps.workspace.countByStatus(query.q, { scope: query.scope, userId }) };
  }

  /**
   * `PATCH /editorial/conversations/:id` — any team member. The assignee must be a team member. A column change logs
   * «نقلتها {actor} ل{column}» in the thread.
   */
  async update(id: string, patch: EditorialConversationUpdateRequest, actorId: string): Promise<EditorialConversationSummary> {
    const directory = await this.deps.team.directory();
    if (patch.assigneeId !== undefined && !directory.has(patch.assigneeId)) throw new ValidationError();

    const before = this.deps.workspace.getConversationSummary(id);
    const actorName = directory.get(actorId)?.displayName;
    const moved = patch.status !== undefined && patch.status !== before.status;
    const systemMessage = moved && patch.status && actorName ? moveMessage(actorName, patch.status) : undefined;
    const updated = this.deps.workspace.updateWorkflow(id, patch, { actorId, systemMessage });
    return withAssignee(updated, directory);
  }
}
