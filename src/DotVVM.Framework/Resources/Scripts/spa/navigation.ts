﻿import * as postback from '../postback/postback';
import * as uri from '../utils/uri';
import * as http from '../postback/http';
import { getViewModel } from '../dotvvm-base';
import { DotvvmPostbackError } from '../shared-classes';
import { loadResourceList } from '../postback/resourceLoader';
import * as updater from '../postback/updater';
import * as counter from '../postback/counter';
import * as events from './events';
import { getSpaPlaceHolderUniqueId, isSpaReady } from './spa';
import { handleRedirect } from '../postback/redirect';
import * as gate from '../postback/gate';

let lastStartedNavigation = -1

export async function navigateCore(url: string, handlePageNavigating?: (url: string) => void): Promise<DotvvmNavigationEventArgs> {
    const currentPostBackCounter = counter.backUpPostBackCounter();
    try {
        // trigger spaNavigating event
        const spaNavigatingArgs: DotvvmSpaNavigatingEventArgs = {
            viewModel: getViewModel(),
            newUrl: url,
            cancel: false
        };
        events.spaNavigating.trigger(spaNavigatingArgs);
        if (spaNavigatingArgs.cancel) {
            throw new DotvvmPostbackError({ type: "event" });
        }

        lastStartedNavigation = currentPostBackCounter
        gate.disablePostbacks()

        // compose URLs
        // TODO: get rid of ___dotvvm-spa___
        const spaFullUrl = uri.addVirtualDirectoryToUrl("/___dotvvm-spa___" + uri.addLeadingSlash(url));
        const displayUrl = uri.addVirtualDirectoryToUrl(url);

        // send the request
        const resultObject = await http.getJSON<any>(spaFullUrl, getSpaPlaceHolderUniqueId());

        // if another postback has already been passed, don't do anything
        if (currentPostBackCounter < lastStartedNavigation) {
            return <DotvvmNavigationEventArgs> { }; // TODO: what here https://github.com/riganti/dotvvm/pull/787/files#diff-edefee5e25549b2a6ed0136e520e009fR852
        }

        // use custom browser navigation function
        if (handlePageNavigating) {
            handlePageNavigating(displayUrl);
        }

        await loadResourceList(resultObject.resources);

        if (resultObject.action === "successfulCommand") {
            updater.updateViewModelAndControls(resultObject, true);
            isSpaReady(true);
        } else if (resultObject.action === "redirect") {
            const x = await handleRedirect(resultObject, true) as DotvvmNavigationEventArgs
            return x
        }

        // trigger spaNavigated event
        const spaNavigatedArgs: DotvvmSpaNavigatedEventArgs = {
            viewModel: getViewModel(),
            serverResponseObject: resultObject,
            isSpa: true,
            isHandled: true
        };
        events.spaNavigated.trigger(spaNavigatedArgs);
        return spaNavigatedArgs;

    } finally {
        // when no other navigation is running, enable postbacks again
        if (currentPostBackCounter == lastStartedNavigation) {
            gate.enablePostbacks()
        }
    }
}
