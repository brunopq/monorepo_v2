type MatchResult<
  T extends Record<string, (arg: A) => R>,
  R extends Promise<U>,
  U,
  A,
> = {
  method: string
  value: Awaited<ReturnType<T[keyof T]>>
}

export function createMatcher<A>() {
  return <T extends Record<string, (arg: A) => R>, R extends Promise<U>, U>(
    matches: T,
  ) => {
    async function match<K extends keyof T | (string & {})>(
      matching: K,
      args: A,
      defaultFn = () => {
        throw new Error("bad input")
      },
    ): Promise<MatchResult<T, R, U, A>> {
      if (matches[matching] === undefined) {
        defaultFn()
      }

      const value = (await matches[matching](args)) as unknown as Awaited<
        ReturnType<T[K]>
      >
      // assertion as string is needed, probably a bug
      // see: https://stackoverflow.com/questions/63721756/with-t-extending-recordstring-any-keyof-t-does-not-give-string-as-type
      return {
        value,
        method: matching as string,
      }
    }

    return match
  }
}

export function extractValue<
  T extends Record<string, (arg: A) => R>,
  R extends Promise<U>,
  U,
  A,
  K extends keyof T | (string & {}),
>(
  result: MatchResult<T, R, U, A> | undefined | null,
  key: K,
): Awaited<ReturnType<T[K]>> | undefined {
  if (!result) return

  if (result.method === key) {
    return result.value as Awaited<ReturnType<T[K]>>
  }
}
