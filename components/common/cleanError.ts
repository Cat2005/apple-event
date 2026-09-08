/** Convex wraps thrown errors; show the humans just the message we wrote. */
export function cleanError(message: string) {
  const match = message.match(/Uncaught Error:\s*(.*?)(\n|$)/);
  return (match?.[1] ?? message).trim();
}
