import util from 'util'
import fs from 'fs'
import path from 'path'
import { Database } from '../types/Database'

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const databasePath = path.join(__dirname, '../../database/database.json')

export async function getDataFromDatabase() {
    try {
        const fileBuffer = await readFile(databasePath)
        const fileString = fileBuffer.toString()
        const data: Database = JSON.parse(fileString)

        return data
    } catch (error) {
        throw new Error(error.message)
    }
}

export async function addNewTagToDatabase(tagName: string) {
    try {
        const { tags, types } = await getDataFromDatabase()
        const lastTag = tags[tags.length - 1]
        const tagNameExists = tags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())

        if (tagNameExists) {
            throw new Error('This tagname is already used in another tag. Please provide another name!')
        }

        if (lastTag) {
            const newTag = {
                id: lastTag.id + 1,
                name: tagName,
                typeId: 2,
            }

            tags.push(newTag)

            await writeFile(databasePath, JSON.stringify({
                types,
                tags,
            }))

            return newTag
        } else {
            throw new Error('There is no tag found')
        }
    } catch (error) {
        throw new Error(error.message)
    }
}

export async function updateTagInDatabase(tagId: number, updatedTagName: string) {
    try {
        const { tags, types } = await getDataFromDatabase()
        const tagMatchIndex = tags.findIndex(tag => tag.id === tagId)

        if (tagMatchIndex > 0) {
            const tagMatch = tags[tagMatchIndex]

            if (tagMatch.name.toLowerCase() !== updatedTagName.toLowerCase()) {
                const updatedTag = {
                    ...tagMatch,
                    name: updatedTagName,
                }

                tags.splice(tagMatchIndex, 0, updatedTag)

                await writeFile(databasePath, JSON.stringify({
                    types,
                    tags,
                }))

                return {
                    tag: updatedTag,
                    isUpdated: true,
                }
            } else {
                return {
                    tag: tagMatch,
                    isUpdated: false,
                }
            }
        } else {
            throw new Error('The tag passed to the server does not exist in the database.')
        }
    } catch (error) {
        throw new Error(error.message)
    }
}

export async function removeTagFromDatabase(tagId: number) {
    try {
        const { tags, types } = await getDataFromDatabase()
        const tagMatchIndex = tags.findIndex(tag => tag.id === tagId)

        if (tagMatchIndex > 0) {
            tags.splice(tagMatchIndex, 1)

            await writeFile(databasePath, JSON.stringify({
                types,
                tags,
            }))

            return {
                isRemoved: true,
                message: `Tag ${tagId} has been removed from the database.`,
            }
        } else {
            return {
                isRemoved: false,
                message: 'The tag could not be found in the database! Removing has failed!',
            }
        }
    } catch (error) {
        throw new Error(error.message)
    }
}
