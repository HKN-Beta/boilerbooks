import { Router } from "express";

const router = Router();

import { committee_name_swap, committee_lut, logger, mailer } from "../common_items";

import bcrypt from "bcrypt";
const bcrypt_rounds = 10;

// ---------------------------
// Start unauthenticated endpoint
// ---------------------------

/*
    Creates a new user account
    cannot be async because of bcrypt
*/
router.post("/", (req, res, next) => {
    if (req.body.fname === undefined ||
        req.body.lname === undefined ||
        req.body.uname === undefined ||
        req.body.email === undefined ||
        req.body.address === undefined ||
        req.body.city === undefined ||
        req.body.state === undefined ||
        req.body.zip === undefined ||
        req.body.pass1 === undefined ||
        req.body.pass2 === undefined ||
        req.body.createpin === undefined) {
        res.status(400).send("All account details must be completed");
        return next();
    }

    if (req.body.fname === "" ||
        req.body.lname === "" ||
        req.body.uname === "" ||
        req.body.email === "" ||
        req.body.address === "" ||
        req.body.city === "" ||
        req.body.state === "" ||
        req.body.zip === "" ||
        req.body.pass1 === "" ||
        req.body.pass2 === "" ||
        req.body.createpin === "") {
        res.status(400).send("All account details must be completed");
        return next();
    }

    // eslint-disable-next-line
    if (req.body.uname.match(/[$&+,/:;=?@ "<>#%{}|\\^~\[\]`]/)) {
        res.status(400).send("Username cannot contain any special characters");
        return next();
    }

    if (req.body.createpin !== process.env.ACCOUNT_PIN) {
        res.status(400).send("Incorrect Creation PIN");
        return next();
    }

    if (req.body.pass1 !== req.body.pass2) {
        res.status(400).send("Passwords do not match");
        return next();
    }

    const user = {
        fname: req.body.fname,
        lname: req.body.lname,
        uname: req.body.uname,
        email: req.body.email,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        pass: req.body.pass1,
    };

    req.context.models.account.createUser(user, res, next);
});

// ---------------------------
// End unauthenticated endpoint
// ---------------------------

/*
    Gets user details, only if requester is the user or the Treasurer
*/
router.get("/:userID", async(req, res, next) => {
    try {
        const [results, ] = await req.context.models.account.getUserTreasurer(req.context.request_user_id);
        if (results.validuser === 0 || req.context.request_user_id !== req.params.userID) {
            res.status(404).send("User not found");
            return next();
        }
    } catch (err) {
        logger.error(err.stack);
        res.status(500).send("Internal Server Error");
        return next();
    }

    try {
        const [results, ] = await req.context.models.account.getUserByID(req.params.userID);
        if (results.length === 0) {
            res.status(400).send("User not found");
            return next();
        }

        res.status(200).send(results[0]);
        return next();
    } catch (err) {
        logger.error(err.stack);
        res.status(500).send("Internal Server Error");
        return next();
    }
});

/*
    Updates user account details, requester must be user
*/
router.put("/:userID", async(req, res, next) => {
    if (req.context.request_user_id !== req.params.userID) {
        res.status(404).send("User not found");
        return next();
    }

    if (req.body.fname === undefined ||
        req.body.lname === undefined ||
        req.body.email === undefined ||
        req.body.address === undefined ||
        req.body.city === undefined ||
        req.body.state === undefined ||
        req.body.zip === undefined) {
        res.status(400).send("All account details must be completed");
        return next();
    }

    if (req.body.fname === "" ||
        req.body.lname === "" ||
        req.body.email === "" ||
        req.body.address === "" ||
        req.body.city === "" ||
        req.body.state === "" ||
        req.body.zip === "") {
        res.status(400).send("All account details must be completed");
        return next();
    }

    const user = {
        fname: req.body.fname,
        lname: req.body.lname,
        uname: req.context.request_user_id,
        email: req.body.email,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
    };

    try {
        await req.context.models.account.updateUser(user);
        res.status(200).send("Account Details Updated");
        return next();
    } catch (err) {
        logger.error(err.stack);
        res.status(500).send("Internal Server Error");
        return next();
    }
});

/*
    Changes user password, requester must be user
    Cannot be async because of bcrypt
*/
router.post("/:userID", (req, res, next) => {
    if (req.context.request_user_id !== req.params.userID) {
        res.status(404).send("User not found");
        return next();
    }

    if (req.body.pass1 === undefined ||
        req.body.pass2 === undefined) {
        res.status(400).send("All account details must be completed");
        return next();
    }

    if (req.body.pass1 === "" ||
        req.body.pass2 === "") {
        res.status(400).send("All account details must be completed");
        return next();
    }

    if (req.body.pass1 !== req.body.pass2) {
        res.status(400).send("Passwords do not match");
        return next();
    }

    // But this can by async
    bcrypt.hash(req.body.pass1, bcrypt_rounds, async function(error, hash) {
        const user = {
            uname: req.context.request_user_id,
            pass: hash,
        };

        try {
            await req.context.models.account.updatePassword(user);
            const [results, ] = await req.context.models.account.getUserByID(req.context.request_user_id);
            res.status(200).send("Password Changed");
            await mailer.sendMail({
                to: results[0].email,
                subject: "Boiler Books Password Changed",
                text: "Your Boiler Books password was recently changed.\n" +
                      "If you made this request, you can safely ignore this message.\n" +
                      "Otherwise, please reach out to IEEE.\n\n" +
                      "This email was automatically sent by Boiler Books",
                html: `<h2>Your Boiler Books password was recently changed.</h2>
                       <p>If you made this request, you can safely ignore this message.<p>
                       <p><b>Otherwise, please reach out to IEEE.</b></p>
                       <br>
                       <small>This email was automatically sent by Boiler Books</small>`,
            });
            next();
        } catch (err) {
            logger.error(err.stack);
            if (!res.headersSent) res.status(500).send("Internal Server Error");
            return next();
        }
    });
});

/*
    Get a list of all purchases made by the user
*/
router.get("/:userID/purchases", async(req, res, next) => {
    if (req.context.request_user_id !== req.params.userID) {
        res.status(404).send("User not found");
        return next();
    }

    try {
        const [results, ] = await req.context.models.purchase.getPurchaseByUser(req.params.userID);
        results.forEach(purchase => {
            purchase.committee = committee_name_swap[purchase.committee];
        });
        res.status(200).send(results);
        return next();
    } catch (err) {
        logger.error(err.stack);
        res.status(500).send("Internal Server Error");
        return next();
    }
});

/*
    Get a list of all active requests user can approve
*/
router.get("/:userID/approvals", async(req, res, next) => {
    if (req.context.request_user_id !== req.params.userID) {
        res.status(404).send("User not found");
        return next();
    }

    try {
        const [results, ] = await req.context.models.purchase.getApprovalsForUser(req.params.userID);
        results.forEach(purchase => {
            purchase.committee = committee_name_swap[purchase.committee];
        });
        res.status(200).send(results);
        return next();
    } catch (err) {
        logger.error(err.stack);
        res.status(500).send("Internal Server Error");
        return next();
    }
});

/*
    Get a list of all active purchases user can complete
*/
router.get("/:userID/completions", async(req, res, next) => {
    if (req.context.request_user_id !== req.params.userID) {
        res.status(404).send("User not found");
        return next();
    }

    try {
        const [results, ] = await req.context.models.purchase.getCompletionsForUser(req.params.userID);
        results.forEach(purchase => {
            purchase.committee = committee_name_swap[purchase.committee];
        });
        res.status(200).send(results);
        return next();
    } catch (err) {
        logger.error(err.stack);
        res.status(500).send("Internal Server Error");
        return next();
    }
});

/*
    Get a list of all active purchases user can reimburse
*/
router.get("/:userID/reimbursements", async(req, res, next) => {
    if (req.context.request_user_id !== req.params.userID) {
        res.status(404).send("User not found");
        return next();
    }

    try {
        const [results, ] = await req.context.models.purchase.getTreasurer(req.params.userID);
        results.forEach(purchase => {
            purchase.committee = committee_name_swap[purchase.committee];
        });
        res.status(200).send(results);
        return next();
    } catch (err) {
        logger.error(err.stack);
        res.status(500).send("Internal Server Error");
        return next();
    }
});

/*
    Get a list of all committee balances user can view
*/
router.get("/:userID/balances", async(req, res, next) => {
    if (req.context.request_user_id !== req.params.userID) {
        res.status(404).send("User not found");
        return next();
    }

    const committees = Object.keys(committee_name_swap);
    const outputBalances = {};

    try {
        for (let committee of committees) {
            const [results, ] = await req.context.models.account.getUserApprovals(req.context.request_user_id, committee);
            if (results.length !== 0) {
                const [results_1, ] = await req.context.models.committee.getCommitteeBalance(committee);
                outputBalances[committee_name_swap[committee]] = results_1[0].balance;
            }
        }
    } catch (err) {
        logger.error(err.stack);
        res.status(500).send("Internal Server Error");
        return next();
    }

    res.status(200).send(outputBalances);
    next();
});

/*
    Get a list of all committees user has approval powers in
*/
router.get("/:userID/committees", async(req, res, next) => {
    if (req.context.request_user_id !== req.params.userID) {
        res.status(404).send("User not found");
        return next();
    }

    try {
        const [results, ] = await req.context.models.account.getUserApprovalCommittees(req.params.userID);

        // very slow very bad
        let filtered_lut = {};
        for (let committee in committee_lut) {
            for (let approval of results) {
                if (committee_lut[committee][0] == approval.committee) {
                    filtered_lut[committee] = committee_lut[committee];
                }
            }
        }

        res.status(200).send(filtered_lut);
        return next();
    } catch (err) {
        logger.error(err.stack);
        res.status(500).send("Internal Server Error");
        return next();
    }
});

export default router;
