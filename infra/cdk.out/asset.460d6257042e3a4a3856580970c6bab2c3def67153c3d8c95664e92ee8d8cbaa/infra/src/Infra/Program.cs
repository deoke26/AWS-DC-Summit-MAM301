using Amazon.CDK;

var app = new App();

new ContosoStack(app, "ContosoStack", new StackProps
{
    Env = new Amazon.CDK.Environment
    {
        Region = "us-east-1"
    }
});

app.Synth();
