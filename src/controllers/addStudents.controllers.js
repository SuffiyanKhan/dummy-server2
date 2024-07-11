// import { addStudents, fetchAllStudentsData ,dummaddStudents} from "../services/AddStudents.services.js";
import { addStudents, fetchAllStudentsData ,dummaddStudents} from "../services/addStudents.services.js";

const addStudentsData = async (req, res) => {
    try {
        const { name, course, date, email, cnic, batchNo, rollno } = req.body;
        const data = {
            name, course, date, email, cnic, batchNo, rollno
        }
        console.log(data)
        const saveaStudentsData = await addStudents(data)
        return res.status(200).json({ status: 200, message: "success", saveaStudentsData })
    } catch (error) {
        return res.status(500).json({ message: "Failed to students data save in DB", ERROR: error.message })
    }
}

const dummyaddStudentsData = async (req, res) => {
    try {
        const saveaStudentsData = await dummaddStudents(req.body.data)
        return res.status(200).json({ status: 200, message: "success", saveaStudentsData })
    } catch (error) {
        return res.status(500).json({ message: "Failed to students data save in DB", ERROR: error.message })
    }
}


// const getAllStudentsData = async (req, res) => {
//     try {
//         const response = await fetchAllStudentsData()
//         return res.status(200).json({ message: "success", studentsData: response })
//     } catch (error) {
//         return res.status(500).json({ message: "To Failed Fecth Data From Database" })
//     }
// }

const getAllStudentsData = async (req, res) => {
    try {
        
        // Assuming fetchAllStudentsData() is an async function that fetches data
        const response = await fetchAllStudentsData();

        if (!response) {
            return res.status(404).json({ message: "No data found" });
        }

        return res.status(200).json({ message: "success", studentsData: response });
    } catch (error) {
        console.error("Error fetching students data:", error);
        return res.status(500).json({ message: "Failed to fetch data from database" });
    }
}


export {
    addStudentsData,
    getAllStudentsData,
    dummyaddStudentsData
}