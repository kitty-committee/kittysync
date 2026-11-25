
import { mergeAttributes, Node } from "@tiptap/core";

type PollOptions = {
    id: string;
    label: string;
};


export const pollNode = Node.create({
    name: "poll",
    group: "block",
    atom: true,
    addAttributes() {
        return {
            pollId: {
                default: null,
                parseHTML: (element) => element.getAttribute('data-poll-id'),
                renderHTML: (attributes) => {
                    return {
                        'data-poll-id': attributes['pollId'],
                    };
                }
            },
            question: {
                default: "",
                parseHTML: (element) => element.getAttribute('data-question'),
                renderHTML: (attributes) => {
                    return {
                        'data-question': attributes['question'],
                    };
                }
            },
            options: {
                default: [],
                parseHTML: (element) =>
                    JSON.parse(element.getAttribute('data-options') ?? "[]") as PollOptions[],
                renderHTML: (attributes) => {
                    return {
                        'data-options': JSON.stringify(attributes['options']),
                    };
                }
            },
        };

    },

    parseHTML() {
        return [
            {
                tag: 'section[data-type="poll"]',
            },
        ];
    },

    // eslint-disable-next-line @typescript-eslint/naming-convention
    renderHTML({ node, HTMLAttributes }) {
        const options = node.attrs["options"] as PollOptions[];

        return [
            "section",
            mergeAttributes(HTMLAttributes, { "data-type": "poll" }),
            ["p", {}, node.attrs["question"]],
            ["ul", {}, ...options.map((option) => ["li", {}, option.label])],
        ];
    }
})