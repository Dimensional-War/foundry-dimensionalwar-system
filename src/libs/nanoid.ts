import { nanoid, customAlphabet } from "nanoid";

const useId = (): string => {
  return (
    customAlphabet(
      "abcdefghijklmnopqrstuvwxyz" + "abcdefghijklmnopqrstuvwxyz".toUpperCase(),
      1
    )() + nanoid()
  );
};

export { useId as nanoid };
