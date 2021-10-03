# BUMP SIMPLE

This package allow you with only one command to automatically:

* Update `package.json` version
* Generate changelog based on all commits messages that begin with `*`
* Add a git tag with version name
* Commit changes
* And finally `npm publish`

## SETUP

Edit your `package.json` to add the scripts needed to update your npm package:

``` javascript
{
    ...
    "scripts": {
        ...
        "bump:major": "node node_modules/@cawita/bump-simple/bump-simple.js --major", // update to major version
        "bump:minor": "node node_modules/@cawita/bump-simple/bump-simple.js --minor", //   #    #  minor   #
        "bump:patch": "node node_modules/@cawita/bump-simple/bump-simple.js --patch", //   #    #  patch   #
        ...
    },
    ...
}
```

# USAGE

`npm run bump:minor` =>  this will update your package changing the minor version (Eg: v1.1.0 => v1.**2**.0)

# FEEDBACK

Don't hesitate to write an issue for any request or make a pull request :)