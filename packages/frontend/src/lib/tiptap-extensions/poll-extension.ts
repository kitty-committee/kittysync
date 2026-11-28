
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

    //review this, it's mostly ai generated, and id like a sane person to look it over
    addNodeView() {
        return ({ node }) => {
            let currentNode = node;
            let selectedOptionId: string | null = null;
            let votedOptionId: string | null = null;
            let changingVote = false;

            const dom = document.createElement("section");
            dom.className = "poll-node-view";
            dom.dataset['type'] = "poll";
            dom.contentEditable = "false";

            const fieldset = document.createElement("fieldset");
            const legend = document.createElement("legend");
            const status = document.createElement("p");
            status.setAttribute("role", "status");

            const voteButton = document.createElement("button");
            voteButton.type = "button";

            const changeButton = document.createElement("button");
            changeButton.type = "button";
            changeButton.textContent = "Change vote";

            fieldset.append(legend);
            dom.append(fieldset, status, voteButton, changeButton);

            // This name groups only the radio buttons in this particular view.
            const radioGroup = `poll-options-${crypto.randomUUID()}`;

            const getOptions = () => currentNode.attrs["options"] as PollOptions[];

            const updateControls = () => {
                const options = getOptions();
                const showingVote = votedOptionId !== null && !changingVote;
                const votedOption = options.find((option) => option.id === votedOptionId);

                fieldset.hidden = showingVote;
                voteButton.hidden = showingVote;
                changeButton.hidden = !showingVote;
                voteButton.disabled = selectedOptionId === null;
                voteButton.textContent = votedOptionId === null ? "Vote" : "Save change";
                status.textContent = showingVote && votedOption
                    ? `Your vote: ${votedOption.label}`
                    : "";
            };

            const renderOptions = () => {
                legend.textContent = currentNode.attrs["question"] as string;
                fieldset.replaceChildren(legend);

                for (const option of getOptions()) {
                    const label = document.createElement("label");
                    const radio = document.createElement("input");

                    radio.type = "radio";
                    radio.name = radioGroup;
                    radio.value = option.id;
                    radio.checked = selectedOptionId === option.id;
                    radio.addEventListener("change", () => {
                        if (!radio.checked) return;

                        selectedOptionId = option.id;
                        updateControls();
                    });

                    label.append(radio, document.createTextNode(option.label));
                    fieldset.append(label);
                }
            };

            voteButton.addEventListener("click", () => {
                if (selectedOptionId === null) return;

                votedOptionId = selectedOptionId;
                changingVote = false;
                updateControls();
            });

            changeButton.addEventListener("click", () => {
                selectedOptionId = votedOptionId;
                changingVote = true;
                renderOptions();
                updateControls();
            });

            renderOptions();
            updateControls();

            return {
                dom,

                update(updatedNode) {
                    if (updatedNode.type !== node.type) return false;

                    if (updatedNode.attrs["pollId"] !== currentNode.attrs["pollId"]) {
                        selectedOptionId = null;
                        votedOptionId = null;
                        changingVote = false;
                    }

                    currentNode = updatedNode;

                    const options = getOptions();
                    if (!options.some((option) => option.id === votedOptionId)) {
                        votedOptionId = null;
                    }
                    if (!options.some((option) => option.id === selectedOptionId)) {
                        selectedOptionId = votedOptionId;
                    }

                    renderOptions();
                    updateControls();
                    return true;
                },

                stopEvent(event) {
                    return event.target instanceof Element && dom.contains(event.target);
                },

                ignoreMutation(mutation) {
                    return mutation.type === "selection" || dom.contains(mutation.target);
                },
            };
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