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
    const org = core.getInput('org_name')
    let continueLoop = true
    let pageNo = 1
    let perPage = 5
    let repos = []
    while (continueLoop) {
        const repos4 = await client.request('GET /orgs/{org}/repos', {
            org: org,
            type: 'all',
            sort: 'full_name',
            per_page: perPage,
            page: pageNo
        })
        const repos5 = _.map(repos4["data"], "name")
        console.log("REPOS 4: " + _.size(repos4))
        console.log("REPOS 5: " + _.size(repos5))
        if(_.size(repos5) > 0) {
            pageNo++
            repos = repos.concat(repos5)
        } else {
            break
        }
        
        
    }
    console.log(JSON.stringify(repos, undefined, 2))
    const text = JSON.stringify(repos, undefined, 2)

    for (let i = 0; i< _.size(repos); i++) {
        await client.request('PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}', {
            org: org,
            team_slug: 'blah',
            owner: org,
            repo: repos[i]
          })
    }

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