import { Match, Template } from "aws-cdk-lib/assertions";
import { QuotaMonitorSQSpoke } from "../lib/sq-spoke.stack";
import { App } from "aws-cdk-lib";

describe("==SQ-Spoke Stack Tests==", () => {
  const app = new App();
  const stack = new QuotaMonitorSQSpoke(app, "SQSpokeStack", {});
  const template = Template.fromStack(stack);

  describe("sq-spoke stack resources", () => {
    it("should have a Lambda Utils Layer with nodejs16.x runtime", () => {
      template.resourceCountIs("AWS::Lambda::LayerVersion", 1);
      template.hasResourceProperties("AWS::Lambda::LayerVersion", {
        CompatibleRuntimes: ["nodejs16.x"],
      });
    });

    it("should have an event bus called QuotaMonitorSpokeBus", () => {
      template.hasResourceProperties("AWS::Events::EventBus", {
        Name: "QuotaMonitorSpokeBus",
      });
    });

    it("should have a dynamodb table for the Service List", () => {
      template.hasResourceProperties("AWS::DynamoDB::Table", {
        KeySchema: [
          {
            AttributeName: "ServiceCode",
            KeyType: "HASH",
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: "ServiceCode",
            AttributeType: "S",
          },
        ],
      });
    });

    it("should have a dynamodb table for the Quota List", () => {
      template.hasResourceProperties("AWS::DynamoDB::Table", {
        KeySchema: [
          {
            AttributeName: "ServiceCode",
            KeyType: "HASH",
          },
          {
            AttributeName: "QuotaCode",
            KeyType: "RANGE",
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: "ServiceCode",
            AttributeType: "S",
          },
          {
            AttributeName: "QuotaCode",
            AttributeType: "S",
          },
        ],
      });
    });

    it("should have custom resource for service list", () => {
      template.resourceCountIs("Custom::SQServiceList", 1);
    });

    it("should have lambda functions for QMListManager, CWPoller, and provider frameworks ", () => {
      template.resourceCountIs("AWS::Lambda::Function", 3);
    });

    it("should have events rules for the pollers", () => {
      template.resourceCountIs("AWS::Events::Rule", 5);
    });

    it("should have DeadLetterQueues for Lambda Functions ", () => {
      template.resourceCountIs("AWS::SQS::Queue", 1);
      template.hasResourceProperties("AWS::Lambda::Function", {
        DeadLetterConfig: Match.objectLike({
          TargetArn: Match.objectLike(Match.anyValue),
        }),
      });
    });
  });
});
