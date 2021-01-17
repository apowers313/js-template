module.exports = function (plop) {
    // controller generator
    plop.setGenerator('node', {
        description: 'Application scaffolding',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'package name'
            },
            {
                type: 'input',
                name: 'desc',
                message: 'package description'
            }
        ],
        actions: [
            {
                type: 'addMany',
                templateFiles: [
                    'templates/**/*',
                ],
                globOptions: {
                    dot: true
                },
                destination: '{{kebabCase name}}',
            },
            // TODO: git init
            // TODO: npm install
            // TODO: create repo and push
            function (answers) {
                //
            }
        ]
    });
};
