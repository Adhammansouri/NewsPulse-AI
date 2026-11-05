import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { EditorialWorkspaceStore } from "./editorialWorkspaceStore.js";

const copy = {
  title: "ترانه تواجه الإعدام",
  dek: "توأم إيراني",
  summary: "خرجتا معاً إلى احتجاجات أصفهان.",
  bullets: ["حكم بالإعدام", "السجن 36 عاماً"],
  sources: [{ name: "Iran HR", url: "https://example.com/story" }],
  language: "ar" as const,
  format: "video" as const,
};

const stores: EditorialWorkspaceStore[] = [];

function openStore() {
  const store = new EditorialWorkspaceStore(":memory:");
  stores.push(store);
  return store;
}

afterEach(() => {
  while (stores.length > 0) stores.pop()?.close();
});

test("creates a conversation with a first version and messages", () => {
  const store = openStore();
  const conversation = store.createConversation({
    title: copy.title,
    format: "video",
    language: "ar",
    itemId: "item-1",
    sourceLabel: "Iran HR",
    sourcePacket: "Headline: twin sisters\nExcerpt: Isfahan protests",
    copy,
    createdBy: "editor-1",
  });

  assert.equal(conversation.versionCount, 1);
  assert.equal(conversation.copy.versionNumber, 1);
  assert.equal(conversation.messages.length, 2);
  assert.equal(conversation.messages[0]?.role, "user");
  assert.equal(conversation.messages[1]?.role, "assistant");
  assert.equal(conversation.copy.title, copy.title);
});

test("adds a revision version without dropping earlier copy", () => {
  const store = openStore();
  const created = store.createConversation({
    title: copy.title,
    format: "video",
    language: "ar",
    sourcePacket: "source",
    copy,
    createdBy: "editor-1",
  });

  const revised = store.addVersion({
    conversationId: created.id,
    copy: { ...copy, title: "توأم من إيران تواجهان حكمين مختلفين" },
    note: "قوّينا الهوك دون إضافة وقائع.",
    createdBy: "editor-1",
    userMessage: "قوِّ الهوك",
  });

  assert.equal(revised.versionCount, 2);
  assert.equal(revised.copy.versionNumber, 2);
  assert.equal(revised.versions[0]?.copy.title, copy.title);
  assert.equal(revised.copy.title, "توأم من إيران تواجهان حكمين مختلفين");
  assert.equal(revised.messages.at(-2)?.content, "قوِّ الهوك");
});

test("restore copies an old version forward and keeps history", () => {
  const store = openStore();
  const created = store.createConversation({
    title: copy.title,
    format: "desk",
    language: "ar",
    sourcePacket: "source",
    copy: { ...copy, format: "desk" },
    createdBy: "editor-1",
  });
  const firstId = created.currentVersionId;
  const revised = store.addVersion({
    conversationId: created.id,
    copy: { ...copy, format: "desk", summary: "نسخة معدلة" },
    note: "اختصار",
    createdBy: "editor-1",
    userMessage: "اختصر دون إضافات",
  });

  const restored = store.restoreVersion(revised.id, firstId, "editor-2");
  assert.equal(restored.versionCount, 3);
  assert.equal(restored.copy.summary, copy.summary);
  assert.equal(restored.copy.versionNumber, 3);
  assert.equal(restored.versions[1]?.copy.summary, "نسخة معدلة");
  assert.equal(restored.messages.at(-1)?.role, "assistant");
  assert.match(restored.messages.at(-1)?.content ?? "", /أُعيدت النسخة 1/);
  assert.equal(restored.messages.filter((message) => /نسخة 1/.test(message.content)).length, 1);
});

test("search lists conversations by title", () => {
  const store = openStore();
  store.createConversation({
    title: "نووي إيران",
    format: "desk",
    language: "ar",
    sourcePacket: "a",
    copy: { ...copy, title: "نووي إيران", format: "desk" },
    createdBy: "editor-1",
  });
  store.createConversation({
    title: "انتخابات ألمانيا",
    format: "desk",
    language: "ar",
    sourcePacket: "b",
    copy: { ...copy, title: "انتخابات ألمانيا", format: "desk" },
    createdBy: "editor-1",
  });

  const found = store.listConversations("إيران");
  assert.equal(found.length, 1);
  assert.equal(found[0]?.title, "نووي إيران");
});

test("approved memory is listed separately from rejected rules", () => {
  const store = openStore();
  const pending = store.createMemoryRule({
    instruction: "حوّل الجمل الانتقالية إلى أسئلة تفتح طبقة جديدة.",
    rationale: "يحافظ على الحبكة دون إضافة.",
    createdBy: "editor-1",
    sourceConversationId: "conv-1",
  });
  store.updateMemoryRule(pending.id, { status: "approved" });
  store.createMemoryRule({
    instruction: "أضف أن الاعترافات انتُزعت تحت التعذيب.",
    rationale: "واقعة لهذه القصة فقط",
    status: "rejected",
    createdBy: "editor-1",
  });

  const approved = store.listMemoryRules("approved");
  assert.equal(approved.length, 1);
  assert.equal(approved[0]?.instruction, pending.instruction);
  assert.equal(store.listMemoryRules("rejected").length, 1);
  assert.equal(store.listMemoryRules().length, 2);
});

test("an approval can be undone back to pending, with the instruction it was suggested with", () => {
  const store = openStore();
  const rule = store.createMemoryRule({
    instruction: "ابدأ المنشور بالرقم الأهم في الخبر قبل أي تمهيد.",
    rationale: "يختصر الطريق للقارئ.",
    createdBy: "editor-1",
    sourceConversationId: "conv-1",
  });
  store.updateMemoryRule(rule.id, { status: "approved", instruction: "ابدأ المنشور بالرقم الأهم في الخبر مباشرة." });

  const undone = store.updateMemoryRule(rule.id, { status: "pending", instruction: rule.instruction });
  assert.equal(undone.status, "pending");
  assert.equal(undone.instruction, rule.instruction);
  assert.equal(store.listMemoryRules("approved").length, 0);

  // Rejected and disabled rules never turn back into suggestions.
  store.updateMemoryRule(rule.id, { status: "rejected" });
  assert.throws(() => store.updateMemoryRule(rule.id, { status: "pending" }), /invalid-request/);
  store.updateMemoryRule(rule.id, { status: "approved" });
  store.updateMemoryRule(rule.id, { status: "disabled" });
  assert.throws(() => store.updateMemoryRule(rule.id, { status: "pending" }), /invalid-request/);
  assert.equal(store.getMemoryRule(rule.id).status, "disabled");
});

test("restore and patch keep carousel slide files", () => {
  const store = openStore();
  const carouselCopy = {
    ...copy,
    format: "carousel" as const,
    summary: "كابشن الخبر",
    carousel: {
      style: "cinematic" as const,
      density: "banner" as const,
      mark: true,
      arc: "dispute" as const,
      styleLock: "35mm night exterior.",
      slides: [
        {
          index: 0,
          role: "hook" as const,
          headline: "البيت الأبيض متهم بسرقة لعبة",
          banner: "باستخدام علامتها",
          attribution: "",
          scene: "A white house at night.",
          status: "ready" as const,
          assetId: "asset-0",
        },
      ],
    },
  };
  const created = store.createConversation({
    title: carouselCopy.title,
    format: "carousel",
    language: "ar",
    sourcePacket: "source",
    copy: carouselCopy,
    createdBy: "editor-1",
  });
  const patched = store.patchVersionCopy(created.currentVersionId, {
    ...carouselCopy,
    carousel: {
      ...carouselCopy.carousel,
      slides: [{ ...carouselCopy.carousel.slides[0], status: "mismatch", mismatch: "النص تغيّر" }],
    },
  });
  assert.equal(patched.carousel?.slides[0]?.status, "mismatch");
  assert.equal(patched.carousel?.slides[0]?.assetId, "asset-0");

  const revised = store.addVersion({
    conversationId: created.id,
    copy: { ...carouselCopy, title: "عنوان أحدث", carousel: { ...carouselCopy.carousel, slides: [] } },
    note: "تعديل",
    createdBy: "editor-1",
  });
  const restored = store.restoreVersion(revised.id, created.currentVersionId, "editor-1");
  assert.equal(restored.copy.carousel?.slides[0]?.assetId, "asset-0");
  assert.equal(restored.copy.carousel?.slides[0]?.headline, "البيت الأبيض متهم بسرقة لعبة");
});
