import { getCurrentWindowOrigin } from './url'

export async function getTags() {
    const url = `${getCurrentWindowOrigin()}/get-tags`
    const fetchVariables = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }

    try {
        const response = await fetch(url, fetchVariables)
        return response.json()
    } catch (error) {
        throw new Error(error.message)
    }
}