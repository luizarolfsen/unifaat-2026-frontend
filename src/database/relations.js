import UserModel from '../app/Models/UserModel.js'
import TaskModel from '../app/Models/TaskModel.js'

export default function initRelations() {
    // Uma tarefa pertence a um usuário
    TaskModel.belongsTo(UserModel, {
        foreignKey: 'id_user',
        as: 'user'
    })

    // Um usuário tem muitas tarefas
    UserModel.hasMany(TaskModel, {
        foreignKey: 'id_user',
        as: 'tasks'
    })
}