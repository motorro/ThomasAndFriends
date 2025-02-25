import {parseHandOver} from "../../../src/assistants/mapping/handOver";

describe("Hand-over mapping", function() {
    it("returns text on normal text", function() {
        parseHandOver("Some text").should.be.equal("Some text");
    });

    it("parses handover", function() {
        parseHandOver("[HAND_OVER:thomas]: Arrange catering").should.deep.equal({
            text: "Arrange catering",
            data: {
                operation: "handOver",
                switchTo: "thomas"
            }
        });
    });
});
