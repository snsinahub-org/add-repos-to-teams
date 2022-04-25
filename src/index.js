const {Octokit} = require('@octokit/rest')
const {retry} = require('@octokit/plugin-retry')
const {throttling} = require('@octokit/plugin-throttling')
const {_} = require('lodash')
const core = require('@actions/core')

const _Octokit = Octokit.plugin(retry, throttling)
const client = new _Octokit({
    auth: core.getInput('GITHUB_TOKEN'),
    throttle: {
        onRateLimit: (retryAfter, options, octokit) => {
            octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`)
            if (options.request.retryCount <= 1) {
                octokit.log.info(`Retrying after ${retryAfter} seconds!`)
                return true
            }
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
            octokit.log.warn(`Abuse detected for request ${options.method} ${options.url}`)
            return true
        },
    }

})

async function run() {
    console.log("ORG NAME: " + core.getInput('org_name'))
    console.log("TEAM NAME: " + core.getInput('team_name'))
    const org = core.getInput('org_name')
    const repos2 = await client.paginate(
        client.rest.repos.listForOrg.endpoint({ 
            org: org,
            per_page: 20
        })
      );
    const repos3 = _.keyBy(repos2, "name")
    const _repos = await client.paginate(client.repos.listForOrg, {
        org: core.getInput('org_name'),
        type: 'all',
        per_page: 100
    })
    const repos = _repos.map(repo => repo.name)
    console.log(JSON.stringify(repos3, undefined, 2))
    const text = JSON.stringify(repos3, undefined, 2)

    // const _teams = await client.paginate(client.teams.listReposInOrg, {
    //     org: core.org_name,
    //     team_slug: '<team_slug>',
    //     per_page: 100
    // })
    // const teams = _teams.map(team => team.name)

    // const filteredRepos = repos.filter(repo => {
    //     return !teams.includes(repo)
    // })

    // if (filteredRepos.length === 0) {
    //     console.log('No new repos to add')
    //     return
    // }

    // let i = 1
    // for (const repo of filteredRepos) {
    //     console.log(`Adding team to repo #${i++} of ${filteredRepos.length}: ${repo}`)
    //     await client.teams.addOrUpdateRepoPermissionsInOrg({
    //         org: core.org_name,
    //         owner: '<owner>',
    //         repo: repo,
    //         team_slug: '<team_slug>',
    //         permission: 'pull',
    //     })
    // }
}

run();