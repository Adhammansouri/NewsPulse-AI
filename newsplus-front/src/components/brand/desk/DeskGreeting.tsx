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
    <header className="desk-masthead">
      {date ? <p className="desk-masthead__date">{date}</p> : null}
      <h1 className="desk-masthead__hello">مرحباً {displayName}</h1>
      <p className="desk-masthead__line">راقب العناوين، ثم لخّص أو ولّد أو ترجم من نفس المكان.</p>
    </header>
  );
}
