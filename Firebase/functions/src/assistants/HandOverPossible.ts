export interface HandOverPossible extends Record<string, unknown> {
    readonly possible: boolean
    readonly comments?: string
}
