import {parseMeta} from "../../../src/assistants/mapping/parseMeta";

describe("Parse meta", function() {
    it("returns text on normal text", function() {
        parseMeta("Some text").should.equal("Some text");
    });

    it("returns meta at the beginning of message", function() {
        parseMeta("[META:one=two&three=four] Some text").should.deep.equal({
            text: "Some text",
            meta: {
                one: "two",
                three: "four"
            }
        });
    });

    it("returns meta at the end of message", function() {
        const text = "Some text [META:one=two&three=four]";
        parseMeta(text).should.deep.equal({
            text: "Some text",
            meta: {
                one: "two",
                three: "four"
            }
        });
    });
});
