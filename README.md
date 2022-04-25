# Add repos to a team

```YAML
    - name: add-repos
      uses: snsinahub-org/add-repos-to-teams
      with:
        team_name: blah
        org_name: ${{ github.repository_owner }}
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```