using Amazon.CDK;
using Amazon.CDK.Assertions;
using Xunit;

namespace Infra.Tests;

public class ContosoStackTests
{
    private readonly Template _template;

    public ContosoStackTests()
    {
        var app = new App();
        var stack = new ContosoStack(app, "TestStack", new StackProps
        {
            Env = new Amazon.CDK.Environment
            {
                Account = "123456789012",
                Region = "us-east-1"
            }
        });
        _template = Template.FromStack(stack);
    }
}
