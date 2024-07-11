import { fetchNewAndUpdateCertificates, getAllIssuedCertificates, processCertificates, serachData } from "../services/sendemail.services.js"

const sendEmail = async (req, res) => {
    try {
        const response = await fetchNewAndUpdateCertificates()
        const responseData = await processCertificates(response)

        return res.status(200).json({ status: 200, message: "success send all emails", responseData: responseData })
    } catch (error) {
        return res.status(500).json({ status: 500, message: "Faild to send email" })
    }
}

const getCertificates = async (req, res) => {
    try {
        const response = await getAllIssuedCertificates()
        return res.status(200).json({ status: 200, message: "success", data: response })
    } catch (error) {
        return res.status(500).json({ status: 500, message: "internal error" })
    }
}

const searchIussedCertificatyes=async(req,res)=>{
    try {
        const query = req.query.q; // Get search query from query parameter
// console.log(query)
    if (!query) {
        return res.status(400).json({ error: 'Search query is required.' });
    }

    // Example: Perform search in your data source (data.json)
    const results = await serachData(query)

        return res.status(200).json({status:200,message:"success",data:results})
    } catch (error) {
        return res.status(500).json({status:500,message:"internal error"})
    }
}

export {
    sendEmail,
    getCertificates,
    searchIussedCertificatyes
}