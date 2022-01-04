import { Router } from 'express';

const router = Router();

import { committee_name_swap } from '../models/index';

// ---------------------------
// Start unauthenticated endpoints
//  cannot be async because of bcrypt
// ---------------------------
router.post('/new', (req, res) => {
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
        return res.status(400).send("All account details must be completed");
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
        return res.status(400).send("All account details must be completed");
    }

    // TODO escape and sanitize all input here

    if (req.body.createpin !== process.env.ACCOUNT_PIN) {
        return res.status(400).send("Incorrect Creation PIN");
    }

    if (req.body.pass1 !== req.body.pass2) {
        return res.status(400).send("Passwords do not match");
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

    req.context.models.account.createUser(user, res);
});

router.post('/login', async (req, res) => {
    if (req.body.uname === undefined || req.body.uname === '' ||
        req.body.pass === undefined || req.body.pass === '') {
        return res.status(400).send("Fill out login details");
    }

    // TODO sanitize user input here

    const user = {
        uname: req.body.uname,
        pass: req.body.pass,
    };

    req.context.models.account.loginUser(user, res);
});

// ---------------------------
// End unauthenticated endpoints
// ---------------------------

router.get('/:userID', async (req, res) => {
    if (req.context.request_user_id !== req.params.userID) {
        return res.status(404).send("User not found");
    }

    try {
        const [results, fields] = await req.context.models.account.getUserByID(req.params.userID);
        if (results.length === 0) {
            return res.status(400).send("User not found");
        }

        return res.status(200).send(results[0]);
    } catch (err) {
        console.log('MySQL ' + err.stack);
        return res.status(500).send("Internal Server Error");
    }
});

router.put('/:userID', async (req, res) => {
    if (req.context.request_user_id !== req.params.userID) {
        return res.status(404).send("User not found");
    }

    if (req.body.fname === undefined ||
        req.body.lname === undefined ||
        req.body.email === undefined ||
        req.body.address === undefined ||
        req.body.city === undefined ||
        req.body.state === undefined ||
        req.body.zip === undefined) {
        return res.status(400).send("All account details must be completed");
    }

    if (req.body.fname === "" ||
        req.body.lname === "" ||
        req.body.email === "" ||
        req.body.address === "" ||
        req.body.city === "" ||
        req.body.state === "" ||
        req.body.zip === "") {
        return res.status(400).send("All account details must be completed");
    }

    // TODO escape and sanitize all input here

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
        const [] = await req.context.models.account.updateUser(user);
        return res.status(200).send("Account Details Updated");
    } catch (err) {
        console.log("MySQL " + err.stack);
        return res.status(500).send("Internal Server Error");
    }
});

router.post('/:userID', (req, res) => {
    if (req.context.request_user_id !== req.params.userID) {
        return res.status(404).send("User not found");
    }

    if (req.body.pass1 === undefined ||
        req.body.pass2 === undefined) {
        return res.status(400).send("All account details must be completed");
    }

    if (req.body.pass1 === "" ||
        req.body.pass2 === "") {
        return res.status(400).send("All account details must be completed");
    }

    if (req.body.pass1 !== req.body.pass2) {
        return res.status(400).send("Passwords do not match")
    }

    // TODO escape and sanitize all input here

    const user = {
        uname: req.context.request_user_id,
        pass: req.body.pass1,
    }

    req.context.models.account.updatePassword(user, res);
});

router.get('/:userID/purchases', async (req, res) => {
    if (req.context.request_user_id !== req.params.userID) {
        return res.status(404).send("User not found");
    }

    try {
        const [results, fields] = await req.context.models.purchase.getPurchaseByUser(req.params.userID);
        results.forEach(purchase => {
            purchase.committee = committee_name_swap[purchase.committee];
        });
        return res.status(200).send(results);
    } catch (err) {
        console.log('MySQL ' + err.stack);
        return res.status(500).send("Internal Server Error");
    }
});

router.get('/:userID/approvals', async (req, res) => {
    if (req.context.request_user_id !== req.params.userID) {
        return res.status(404).send("User not found");
    }

    try {
        const [results, fields] = await req.context.models.purchase.getApprovalsForUser(req.params.userID);
        return res.status(200).send(results);
    } catch (err) {
        console.log('MySQL ' + err.stack);
        return res.status(500).send("Internal Server Error");
    }
});

export default router;
