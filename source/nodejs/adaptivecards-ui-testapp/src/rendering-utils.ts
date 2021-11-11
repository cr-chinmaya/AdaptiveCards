// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {getTestCasesList} from "./file-retriever-utils";
import { Action, AdaptiveCard, ExecuteAction, HostConfig, IMarkdownProcessingResult, Input, OpenUrlAction, SubmitAction } from "adaptivecards";
import * as Remarkable from "remarkable";


export function listAllFiles(): HTMLLIElement[] {
    const testCasesList: HTMLLIElement[] = [];

    const files: string[] = getTestCasesList();

    files.forEach((testCase) => {
	    const firstSlash: number = testCase.indexOf("/");
        const lastSlash: number = testCase.lastIndexOf("/");
        const lastPeriod: number = testCase.lastIndexOf(".");
        const testCaseName: string = testCase.substring(0, firstSlash) + testCase.substring(lastSlash, lastPeriod);

        const itemLink: HTMLAnchorElement = document.createElement("a");
        itemLink.setAttribute("href", "#");
        itemLink.setAttribute("onClick", `renderTestCase('${testCase}')`);
        itemLink.setAttribute("id", testCaseName);

        const itemLinkText: Text = document.createTextNode(testCaseName);
        itemLink.appendChild(itemLinkText);

        const itemListItem: HTMLLIElement = document.createElement("li");
        itemListItem.appendChild(itemLink);

        testCasesList.push(itemListItem);
    });

    return testCasesList;
}

export function readAndRenderCard(fileName: string, callbackFunction: Function): void {
    const rawFile: XMLHttpRequest = new XMLHttpRequest();
    rawFile.open("GET", `samples/${fileName}`, true);

    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4) {
            const fileContents: string = rawFile.responseText;
            const fileAsJson: any = JSON.parse(fileContents);
            renderCard(fileAsJson, callbackFunction);
        }
    };

    rawFile.send();
}

export function renderCard(cardJson: any, callbackFunction: Function): void {
    // Create an AdaptiveCard instance
    const adaptiveCard: AdaptiveCard = new AdaptiveCard();

    // Set its hostConfig property unless you want to use the default Host Config
    // Host Config defines the style and behavior of a card
    adaptiveCard.hostConfig = new HostConfig({
	    fontFamily: "Segoe UI, Helvetica Neue, sans-serif"
        // More host config options
    });

    // Set the adaptive card's event handlers. onExecuteAction is invoked
    // whenever an action is clicked in the card
    adaptiveCard.onExecuteAction = (action: Action) => {
        const actionType: string = action.getJsonTypeName();
        let inputsAsJson: string = "";

        if (actionType === SubmitAction.JsonTypeName || actionType === ExecuteAction.JsonTypeName){
            const card: AdaptiveCard = adaptiveCard;
            const inputs: Input[] = card.getAllInputs(true);
            const inputsMap = {};

            inputs.forEach((input) => {
                inputsMap[input.id] = input.value;
            });

            inputsAsJson = JSON.stringify(inputsMap);
        }
        else if (actionType === OpenUrlAction.JsonTypeName) {
            const actionAsOpenUrl: OpenUrlAction = action;
            inputsAsJson = inputsAsJson.concat("{\"url\": \"", actionAsOpenUrl.url, "\"}");
        }

        const retrievedInputsDiv: HTMLElement = document.getElementById("retrievedInputsDiv");
        retrievedInputsDiv.innerHTML = inputsAsJson;
    };

    // For markdown support you need a third-party library
    // E.g., to use markdown-it, include in your HTML page:

    AdaptiveCard.onProcessMarkdown = function(text: string, result: IMarkdownProcessingResult) {
        result.outputHtml = new Remarkable.Remarkable().render(text);
        result.didProcess = true;
    };

    // Parse the card payload
    adaptiveCard.parse(cardJson);

    // Render the card to an HTML element:
    callbackFunction(adaptiveCard.render());
}