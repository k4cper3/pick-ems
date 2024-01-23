import * as fs from 'fs/promises'
import * as path from 'path'
import { llm } from '../../utils'
import { SYSTEM_PROMPT } from './prompt'
import { SCHEMA } from './schema'

const fileExists = (path: string) =>
	fs.stat(path).then(
		() => true,
		() => false
	)

export type NewsAnalysis = (typeof SCHEMA)['type']

/**
 * Given an article, this analyzes the article to extract the
 * team it is associated with and a summary of the key takeaways from the article.
 *
 * @param title The title of the article.
 * @param content The content of the article.
 * @returns {Promise<NewsAnalysis>} The analysis of the article.
 */
export async function newsAnalyst(
	title: string,
	content: string,
	team: string,
	cacheResponse = true
): Promise<NewsAnalysis> {
	const articlesPath = path.join(__filename, '../../../../../', 'articles/')
	const filename = `${team}-${title}.json`
	const filePath = path.join(articlesPath, filename)

	const summaryAlreadyDone = await fileExists(filePath)

	if (cacheResponse && summaryAlreadyDone) {
		const file = await fs.readFile(filePath, 'utf-8')
		console.log('returning cached file for', filePath)
		return JSON.parse(file) as NewsAnalysis
	}

	// 5) open ai will tell what is the primaryTeam talked about in the article,
	// a summary of it
	const article = `${title}\n===\n\n${content}`
	const prompt = SYSTEM_PROMPT(team)

	const response = await llm(prompt, article, SCHEMA)

	if (cacheResponse) {
		console.log(articlesPath)
		await fs.mkdir(articlesPath, { recursive: true })
		await fs.writeFile(filePath, JSON.stringify(response), 'utf-8')
	}

	return response
}
