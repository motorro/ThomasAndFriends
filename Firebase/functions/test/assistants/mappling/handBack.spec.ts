import {parseHandBack} from "../../../src/assistants/mapping/handBack";

describe("Hand-back mapping", function() {
    it("returns text on normal text", function() {
        parseHandBack("Some text").should.be.equal("Some text");
    });

    it("parses handback", function() {
        parseHandBack("[HAND_BACK]: Arrange catering").should.deep.equal({
            text: "Arrange catering",
            data: {
                operation: "handBack"
            }
        });
    });
});
