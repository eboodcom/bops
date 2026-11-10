/**
 * The attached runner's loopback socket is on the Orgo VM, NOT on Contabo.
 * This selector prevents accidental attempts to connect to the wrong host.
 * The only currently supported cross-host channel is Orgo's authenticated
 * REST API for read-only computer metadata, via the existing Orgo client.
 */
export type ExternalTransportOperation =
  | "computer-metadata"
  | "runner-health"
  | "desktop-input"
  | "task-execution"
  | "shell"
  | "install"
  | "delete";

export type ExternalTransportDecision =
  | { permitted: true; channel: "orgo-read-only-api" }
  | { permitted: false; reason: string };

export function selectExternalTransport(input: {
  operation: ExternalTransportOperation;
  ownerVerified: boolean;
  identityVerified: boolean;
  attached: boolean;
}): ExternalTransportDecision {
  if (!input.attached || !input.ownerVerified || !input.identityVerified)
    return { permitted: false, reason: "Attachment identity and ownership must be verified." };
  if (input.operation === "computer-metadata")
    return { permitted: true, channel: "orgo-read-only-api" };
  return { permitted: false, reason: "No audited cross-host runner transport exists for this operation." };
}
