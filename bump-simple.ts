/* eslint-disable no-console */
// need to be first
import gitLogParser from 'git-log-parser'
import fs from 'fs'
import inquirer from 'inquirer'
import util from 'util'
import childProcess from 'child_process'

import { C, timeout } from 'topkat-utils'

const exec = util.promisify(childProcess.exec)

generateLog()

const execSafe = async command => {
    try {
        var { stdout, stderr } = await exec(command)
        await timeout(200)
    } catch (err) {
        console.error(err)
    } finally {
        if (stdout) console.log(stdout)
        console.error(stderr)
    }
    return true
}

/** Used like `node bump-simple.js --patch`
 * * generate changeLog from commit messages that are preceded by `* myMessage`
 * * change package.json version and add a git tag with version name
 * * commit
 * * npm publish
 */
async function generateLog() {

    try {
        const summary = {} as { version: string, name: string, changelog: string }

        const dirName = process.cwd()
        const packagePath = `${dirName}/package.json`
        const changelogPath = `${dirName}/CHANGELOG.md`

        const updateChangelog = fs.existsSync(changelogPath)

        const versionType = process.argv[2].replace('--', '')

        const versionTypeN = ['major', 'minor', 'patch'].indexOf(versionType)

        const stream = gitLogParser.parse()


        const { version: versionStr, name } = require(packagePath)

        const version = versionStr.split('.')

        const newVersion = version.map((n, i) => i === versionTypeN ? parseInt(n) + 1 : n)
        const newVersionStr = newVersion.join('.')
        summary.version = newVersionStr
        summary.name = name

        C.info(`Ready to bump "${name}" from ${versionStr} to ${newVersionStr} 🚀`)

        await inquirer.prompt({
            type: 'list',
            name: 'confirm',
            message: 'Please,\n\nCOMMIT your actual changes and CONFIRM.\n\nA special commit will be made with the version number.\n',
            choices: ['Ok, I have done it'],
        })

        const changelogContent = fs.readFileSync(changelogPath, 'utf-8')

        const chunks = []
        let changeLogAppend = `### v${newVersionStr}\n`

        stream.on('data', chunk => chunks.push(chunk))

        let unlock = false
        stream.on('end', () => unlock = true)
        while (!unlock) await timeout(50)

        //----------------------------------------
        // CHANGELOG
        //----------------------------------------
        for (const commit of chunks) {
            let body = commit.subject + (commit.body ? '\n' + commit.body : '')
            // subject: 'version - 3.9.1'
            if (body.includes(`version - ${versionStr}`)) break // we find last version

            body = body
                .replace(/ \* /g, '\n* ') // * add a line break in lists
                .replace(/^(?! ?[*-]).*\n?/gm, '') // * remove all lines that do not start with * or # or -

            if (
                !(/^\s*$/.test(body)) && // empty lines no text
                !changelogContent.includes(body)
            ) {
                changeLogAppend += body + '\n'
            }

        }

        if (updateChangelog) {
            const str = fs.readFileSync(changelogPath)
            if (changeLogAppend.split('\n').filter(n => n).length > 1) {
                let fileContent = changeLogAppend + '\n' + str
                fileContent = fileContent.split('\n').filter((e, i, arr) => arr.indexOf(e) === i).join('\n').replace(/\n+(#+)/g, '\n\n$1')
                fs.writeFileSync(changelogPath, fileContent)
                summary.changelog = changeLogAppend
            }
        }

        //----------------------------------------
        // CHANGE VERSION and git new tag
        // GIT COMMIT
        //----------------------------------------

        await execSafe(`git add -A`)
        await execSafe(`git commit -m 'version - ${newVersionStr}'`)
        await execSafe(`git push`)

        await execSafe(`npm version ${versionType}`)

        await execSafe(`npm publish`)

        await execSafe(`git push`)

    } catch (error) {
        console.error(error)
    }
}