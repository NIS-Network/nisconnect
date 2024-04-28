export default function jsonStringifyBigInt(o: object): string {
    return JSON.stringify(o, (key, value) => (typeof value == 'bigint' ? Number(value) : value))
}
