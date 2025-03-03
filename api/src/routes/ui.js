/*
   Copyright 2022 Purdue IEEE and Hadi Ahmed

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import { Router } from "express";
import { logger } from "../utils/logging.js";

const router = Router();

router.get("/text", (req, res, next) => {
    res.status(200).send(process.env.UI_NAV_TEXT);
    next();
});

router.get("/image", (req, res, next) => {
    res.status(200).sendFile(process.env.UI_NAV_IMAGE, (err) => {
        if (err) {
            if (!res.headersSent) {
                res.status(500).send("Internal Server Error");
                logger.error(err.message);
            }
        }
        next();
    });
});

router.get("/link", (req, res, next) => {
    res.status(200).send(process.env.UI_NAV_LINK);
    next();
});

router.get("/login", (req, res, next) => {
    const login_details = {
        "type": process.env.UI_LOGIN_TYPE,
    };

    if (login_details.type === "oidc") {
        login_details.oidc_name = process.env.UI_LOGIN_OIDC_NAME;
        login_details.oidc_profile = process.env.UI_LOGIN_OIDC_PROFILE;
    }

    res.status(200).send(login_details);
    next();
});

export default router;
