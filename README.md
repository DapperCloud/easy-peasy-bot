# easy-peasy-bot

## A bot to query JIRA

This is a prototype project. Its purpose is to query and print jira tickets directly in slack.

# Run the bot

Clone the project.
Run `npm install` to install dependencies.
Copy `config.yml.example` to `config.yml` and set your credentials.
Then, simply run the bot with `npm start`.

# Available commands

The bot only reacts to direct messages.

```status [JIRA ID]```
Print the details of a given ticket. Example: `status JA-3892`


```label [LABEL]```
Print a list of all `IN PROGRESS` tickets with given label. Example: `label support`
