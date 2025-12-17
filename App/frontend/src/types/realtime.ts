export const HUB_EVENTS = {
  StepUpdate: "stepUpdate",
  ResultReady: "resultReady",
} as const;

export type HubEventName = (typeof HUB_EVENTS)[keyof typeof HUB_EVENTS];
