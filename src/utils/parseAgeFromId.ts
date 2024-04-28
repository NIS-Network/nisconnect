export default function parseAgeFromId(id: string): number {
    const yearEnding = id.slice(0, 2)
    const now = new Date()
    let century = parseInt(now.getFullYear().toString().slice(0, 2))
    if (parseInt(now.getFullYear().toString().slice(2, 4)) <= parseInt(yearEnding)) {
        century -= 1
    }
    const birthYear = `${century.toString()}${yearEnding}`
    return now.getFullYear() - parseInt(birthYear)
}
