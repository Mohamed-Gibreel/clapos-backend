// Cash drawers can't dispense anything smaller than a quarter, so cash
// payments are collected/changed in 0.25 increments — card payments charge
// the exact total instead. Mirrors the identically-named helper in the
// Flutter app's cart_cubit.dart; the two must stay in lockstep for the
// change shown at checkout to match what actually gets persisted.
export function roundToNearestQuarter(value: number): number {
  return Math.round(value * 4) / 4;
}
