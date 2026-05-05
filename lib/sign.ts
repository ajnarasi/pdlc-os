import type { AuditEntry, Citation, EvalVerdict, StageId } from "./types";

function fnv1a(input: string): string {
  const FNV_PRIME = 0x01000193;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function deterministicHash(payload: unknown): string {
  const serialized = JSON.stringify(payload, Object.keys(payload as object).sort());
  const a = fnv1a(serialized);
  const b = fnv1a(serialized.split("").reverse().join(""));
  return `${a}${b}`;
}

export interface SignArgs {
  stage: StageId;
  agent: string;
  artifactName: string;
  artifact: unknown;
  evalScore: number;
  evalVerdict: EvalVerdict;
  citations: Citation[];
  parentHashes: string[];
  timestampISO?: string;
}

export function sign(args: SignArgs): AuditEntry {
  const timestampISO = args.timestampISO ?? new Date().toISOString();
  const hash = deterministicHash({
    stage: args.stage,
    agent: args.agent,
    artifactName: args.artifactName,
    artifact: args.artifact,
    parentHashes: args.parentHashes,
    timestampISO,
  });
  return {
    stage: args.stage,
    agent: args.agent,
    artifactName: args.artifactName,
    evalScore: args.evalScore,
    evalVerdict: args.evalVerdict,
    citations: args.citations,
    hash,
    parentHashes: args.parentHashes,
    timestampISO,
  };
}
