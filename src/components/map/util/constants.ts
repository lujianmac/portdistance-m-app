export const SpeedDefault = 12

export const RouteStateEnum = {
  NoPass: { name: 'no-pass', value: '-1' as const },
  AllowPass: { name: 'allow-pass', value: '0' as const },
  Pass: { name: 'pass', value: '1' as const }
}

export const defaultExcRoutePoint: number[] = [-2, 19665, 53829, 13567, 25091, 22445, 61705]
