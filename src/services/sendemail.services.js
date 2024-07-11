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
            subject: `Congratulations  ${certificate.name}!Your Certificate for ${certificate.course} is Ready to Download`,
            text: `Dear ${certificate.name},\n\nCongratulations on successfully completing the ${certificate.course}!
We are pleased to inform you that your certificate is now available for download. \n\n
To access your certificate, please click on the link below:${certificate.certificateUrl}
We encourage you to share your achievement on social media using the integrated sharing options.\n\n
This is a great way to showcase your hard work and dedication to your network.
If you have any questions or need further assistance, please do not hesitate to contact us.\n\n
Best regards,\n\n
SMIT team`,
            attachments: [
                {
                    filename: 'certificate.pdf',
                    path: pdfPath
                }
            ]
        }).then(res => console.log(`Success sending email to suffiyanahmed804092@gmail.com`))
            .catch(err => console.log(`Error sending email to suffiyanahmed804092@gmail.com`))

        certificate.isEmail = true;
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

const getAllIssuedCertificates = async () => {
    try {
        const getCertificates = await Certificate.find({ isEmail: true }).exec();
        return getCertificates
    } catch (error) {
        throw error
    }
}

const serachData = async (query) => {
    try {
        const responseData = await Certificate.find({ rollno: { $regex: new RegExp(query, 'i') } });
        return responseData
    } catch (error) {
        throw error
    }
}

export {
    fetchNewAndUpdateCertificates,
    processCertificates,
    startRealTimeTracking,
    getAllIssuedCertificates,
    serachData
}