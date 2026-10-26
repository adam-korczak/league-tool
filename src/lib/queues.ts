const QUEUES: Record<number, string> = {
  0: "Custom",
  400: "Normal Draft",
  420: "Ranked Solo/Duo",
  430: "Normal Blind",
  440: "Ranked Flex",
  450: "ARAM",
  480: "Swiftplay",
  490: "Quickplay",
  700: "Clash",
  720: "ARAM Clash",
  900: "ARURF",
  1700: "Arena",
  1900: "URF",
};

export const queueName = (id: number) => QUEUES[id] ?? "Special Mode";
