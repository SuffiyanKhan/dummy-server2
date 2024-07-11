import fs from 'fs';
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios'
import SibApiV3Sdk from 'sib-api-v3-sdk';
import db from '../modules/index.js'
import sendEmail from './mail.service.js';
import { serverConfig } from '../configs/server.config.js';

const { certificate: Certificate, students: Students } = db

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pdfDir = path.join(__dirname, 'temp/pdfs');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = serverConfig.sendinblueapikey;

const startRealTimeTracking = async () => {
    try {
        const pipeline = [
            { $match: { 'fullDocument.courseIsComplete': true } }
        ];

        const changeStream = Certificate.watch(pipeline);

        return new Promise((resolve, reject) => {
            changeStream.on('change', (change) => {
                console.log('Real-time change:', change);
                resolve(change);
            });

            changeStream.on('error', (error) => {
                console.error('Change stream error:', error);
                reject(error);
            });
        });
    } catch (error) {
        console.error('Error setting up real-time tracking:', error.message);
        throw new Error('Real-time tracking setup failed');
    }
};

async function fetchNewAndUpdateCertificates() {
    try {
        const certificates = await Certificate.find({ isEmail: false });
        const changeStream = Certificate.watch();
        changeStream.on('change', async (changes) => {
            if (changes.operationType === 'insert' || changes.operationType === 'update') {
                console.log()
            }
            console.log("CHANGES IN DATABASE", changes)
        })
        console.log(certificates.length)
        return certificates
    } catch (error) {
        console.error('Error fetching certificates:', error);
    }
}

async function processCertificates(certificates) {
    for (const certificate of certificates) {
        if (certificate.certificateUrl && !certificate.isEmail) {
            await sendCertificateEmail(certificate);
        }
    }
}

async function sendCertificateEmail(certificate) {

    try {
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
        }

        if (!certificate.certificateUrl.startsWith('http')) {
            throw new Error(`Invalid certificate URL: ${certificate.certificateUrl}`);
        }

        const pdfData = certificate.certificateUrl;
        const response = await axios.get(pdfData, { responseType: 'arraybuffer' });
        const pdfBuffer = Buffer.from(response.data);

        const pdfPath = path.join(pdfDir, `${certificate.rollno}.pdf`);
        fs.writeFileSync(pdfPath, pdfBuffer);
        console.log(`Saved PDF for document with ID: ${certificate.name}`);
        await sendEmail({
            to: certificate.email,
            subject: 'Your Course Completion Certificate',
            text: `Dear ${data.name},\n\nCongratulations on completing the ${data.course} course. Attached is your certificate.\n\nBest regards,\nYour Team`,
            attachments: [
                {
                    filename: 'certificate.pdf',
                    path: pdfPath
                }
            ]
        }).then(res => console.log(`Success sending email to suffiyanahmed804092@gmail.com`))
            .catch(err => console.log(`Error sending email to suffiyanahmed804092@gmail.com`))
        // // Send email using Sendinblue
        // const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        // const sender = {
        //     email: "suffiyanahmed804092@gmail.com",
        //     name: "Saylani It Mass Training"
        // };
        // const receiver = [{
        //     email: certificate.email
        // }];

        // // Attach the PDF to the email
        // const sendEmail = await apiInstance.sendTransacEmail({
        //     sender,
        //     // to: "suffiyanahmed804092@gmail.com",
        //     to: receiver,
        //     subject: "Your Certificate",
        //     htmlContent: "<p>Please find your certificate attached.</p>",
        //     // attachment: [{
        //     //     name: `${certificate.rollno}.pdf`,
        //     //     content: pdfBuffer.toString('base64') // Attach PDF as base64 content
        //     // }]
        // });

        certificate.isEmail = false;
        await certificate.save();
        fs.unlinkSync(pdfPath);
        console.log(`Certificate email sent to ${certificate.email} `);
        let success = "Certificate email sent to"
        return success
    } catch (error) {
        console.error('Error sending certificate email:', error.message);
        throw error
    }
}

export {
    fetchNewAndUpdateCertificates,
    processCertificates,
    startRealTimeTracking,
}