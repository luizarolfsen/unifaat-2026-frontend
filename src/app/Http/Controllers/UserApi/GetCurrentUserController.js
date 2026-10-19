import UserModel from "../../../Models/UserModel.js";

export default async function GetCurrentUserController(request, response) {
    try {
        const userId = request.user.id;

        const user = await UserModel.findByPk(userId);

        if (!user) {
            return response.status(404).json({
                error: "User not found"
            });
        }

        return response.json(user);
    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: "Internal server error"
        });
    }
}
