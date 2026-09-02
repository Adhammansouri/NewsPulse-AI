type DeskGreetingProps = {
  displayName: string;
};

function formatDeskDate() {
  try {
    return new Date().toLocaleDateString("ar", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function DeskGreeting({ displayName }: DeskGreetingProps) {
  const date = formatDeskDate();

  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="brand-text-secondary text-sm">{date}</p>
        <h1 className="brand-text-primary mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          مرحباً {displayName}
        </h1>
      </div>
      <p className="brand-text-secondary max-w-sm text-sm leading-6">
        مكتب التحرير — راقب العناوين، ثم لخّص أو ولّد أو ترجم من نفس المكان.
      </p>
    </header>
  );
}
