import {messageMapper} from "../../../src/assistants/mapping/messageMapper";

describe("Complex mapping", function() {
    it("returns ordinary message", function() {
        messageMapper("Some text").should.equal("Some text");
    });

    it("returns hand over", function() {
        messageMapper("[HAND_OVER:thomas]: Arrange catering").should.deep.equal({
            text: "Arrange catering",
            data: {
                operation: "handOver",
                switchTo: "thomas"
            }
        });
    });

    it("returns hand back", function() {
        messageMapper("[HAND_BACK]: Arrange catering").should.deep.equal({
            text: "Arrange catering",
            data: {
                operation: "handBack"
            }
        });
    });

    it("returns meta", function() {
        messageMapper("Some text [META:one=two&three=four]").should.deep.equal({
            text: "Some text",
            meta: {
                one: "two",
                three: "four"
            }
        });
    });

    it("returns hand over with meta", function() {
        messageMapper("[HAND_OVER:thomas]: Some text [META:one=two&three=four]").should.deep.equal({
            text: "Some text",
            data: {
                operation: "handOver",
                switchTo: "thomas"
            },
            meta: {
                one: "two",
                three: "four"
            }
        });
    });

    it("returns hand over with meta multiline", function() {
        messageMapper(`
            [HAND_OVER:thomas]: Some text
            [META:one=two&three=four]
        `).should.deep.equal({
            text: "Some text",
            data: {
                operation: "handOver",
                switchTo: "thomas"
            },
            meta: {
                one: "two",
                three: "four"
            }
        });
    });
});
