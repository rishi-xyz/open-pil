import { publicClient } from "./arkiv/clients";
export type BlockTiming = { currentBlock: string; currentBlockTime: number; blockDuration: number };
export function blockToTime(block: string, timing: BlockTiming): number {
  return (timing.currentBlockTime + Number(BigInt(block) - BigInt(timing.currentBlock)) * timing.blockDuration) * 1000;
}
export async function getBlockTime(block: string) {
  const timing = await publicClient.getBlockTiming();
  return blockToTime(block, { ...timing, currentBlock: timing.currentBlock.toString() });
}
