# Api Invest

## Setting up the development environment

1. Install all of the project's `dependencies` by running:

    ```sh
    yarn
    ```

2. Configure ESLint to automatically format changes when saving a file:

    Add to your `Visual Studio Code` (JSON) Settings the following lines:

    ```js
    {
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
            "source.fixAll.eslint": true
        },
    }
    ```
    You can search for it by typing `Ctrl + Shift + P` in your `Visual Studio Code`.

    Obs: You can also install 2 plugins on your `Visual Studio Code` for better practices:

    + ESLint
    + EditorConfig for VS Code

## Running the development server locally

1. Run the `Node.js` Development Server with the following script:

    ```sh
    yarn start
    ```

2. Access through the following URL:

    [http://localhost:3333/](http://localhost:3333/)

    The development server will update automatically when changes are made to the source code.
