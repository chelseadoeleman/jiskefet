import * as React from 'react'
import { TagList } from '../atoms/TagList'
import { getCurrentWindowOrigin } from '../../utils/url'
import { Tag } from '../../types/Database'
import socketIO from 'socket.io-client'
import { getTags } from '../../utils/fetchers'
import { Button } from '../atoms/Button'
import { LanguageContext } from '../LanguageProvider'
import { Language } from '../../types/Language'

interface Props {
    addTag: (tag: Tag) => void
}

interface State {
    tags: Tag[]
    open: boolean
}

const TagTypeMap = {
    subType: 0,
    runType: 1,
    genericType: 2,
}

export class CreateTag extends React.Component<Props, State> {
    public state: State = {
        tags: [],
        open: false,
    }

    private tagNameInputRef = React.createRef<HTMLInputElement>()
    private createTagButtonRef = React.createRef<HTMLButtonElement>()

    public async componentDidMount() {
        const { data: tags, success } = await getTags()

        if (success) {
            this.setState({ tags })

            const io = socketIO()
            io.on('connect', this.onSocketConnection(io))
        } else {
            throw new Error('Something went wrong fetching the tags!')
        }
    }

    public render() {
        const { addTag } = this.props
        const { tags, open } = this.state
        const subTypeTags = tags.filter(tag => tag.typeId === TagTypeMap.subType)
        const runTypeTags = tags.filter(tag => tag.typeId === TagTypeMap.runType)
        const genericTypeTags = tags.filter(tag => tag.typeId === TagTypeMap.genericType)

        return (
            <LanguageContext.Consumer>
                {(language: Language) => (
                    <div className={`CreateTags`}>
                        <Button
                            type='button'
                            className='collapsible Capitalize'
                            onClick={() => this.togglePanel()}
                        >
                            <svg xmlns='http://www.w3.org/2000/svg' className='plus' viewBox='0 0 72.59 72.59'>
                                <circle className='row-1' cx='36.29' cy='36.29' r='35.29'/>
                                <path className='row-2' d='M36.49,19.43q-.09,16.86-.2,33.73'/>
                                <path className='row-2' d='M19.43,36.2l33.73.19'/>
                            </svg>
                            {language.App.Generic.addTags}
                        </Button>
                        {open ? (
                            <div className='content'>
                                <h3 className={`Capitalize`}>{language.App.Generic.addExistingTags}</h3>
                                <TagList
                                    category={language.App.Generic.subType}
                                    tags={subTypeTags}
                                    addTag={addTag}
                                />
                                <TagList
                                    category={language.App.Generic.runType}
                                    tags={runTypeTags}
                                    addTag={addTag}
                                />
                                <TagList
                                    category={language.App.Generic.generic}
                                    tags={genericTypeTags}
                                    addTag={addTag}
                                />

                                <h3 className={`Capitalize`}>{language.App.Generic.createNewTag}</h3>
                                <form onSubmit={this.onCreateNewTag}>
                                    <label>
                                        {language.App.Generic.name}
                                        <input type='text' ref={this.tagNameInputRef}/>
                                    </label>
                                    <button type='submit' ref={this.createTagButtonRef}>{language.App.Generic.createTag}</button>
                                </form>
                            </div>
                        ) : null}
                    </div>
                )}
            </LanguageContext.Consumer>
        )
    }

    private onCreateNewTag = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const createTagButton = this.createTagButtonRef.current
        const input = this.tagNameInputRef.current

        if (createTagButton) {
            createTagButton.blur()
        }

        if (input) {
            const { value } = input

            if (value && typeof value === 'string' && value.length > 0) {
                const url = `${getCurrentWindowOrigin()}/create-tag`
                const fetchVariables = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ tagName: value }),
                }

                try {
                    const response = await fetch(url, fetchVariables)
                    const data = await response.json()

                    if (!data.success) {
                        throw new Error(data.error)
                    } else {
                        console.info('Successfully added a tag!')
                    }
                } catch (error) {
                    throw new Error(error.message)
                }
            } else {
                throw new Error('You have not given a valid name to the server!')
            }
        }
    }

    private onSocketConnection = (io: SocketIOClient.Socket) => {
        return () => {
            console.info('Socket connection established')

            io.on('tag-created', this.onTagCreated)
        }
    }

    private onTagCreated = (newTag: Tag) => {
        const { tags } = this.state

        if (!tags.find(tag => tag.id === newTag.id)) {
            this.setState({ tags: [ ...tags, newTag ] })
        }
    }

    private togglePanel = () => {
        this.setState({ open: !this.state.open })
    }
}
