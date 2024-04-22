import { Alert } from "react-native"
import { useDispatch, useSelector } from "react-redux"
import { supabase } from "../lib/supabase"
import { checkingCredentials, clearErrorMessage, login, logout } from "../Store/Auth/AuthSlice"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { onLogoutIncident } from "../Store/Incident/IncidentSlice"


export const useAuthStore = () => {

    const {status } = useSelector(state => state.auth)
    const data_auth = useSelector(state => state.auth)
    const dispatch = useDispatch()

    const startLogin = async({email, password}) => {
        try {
            console.log({email, password});
            dispatch(checkingCredentials())
            const { error, data } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                Alert.alert(error.message);
                return;
            }
    
            // Obtener el token de acceso y otros datos relevantes
            const { session, user } = data;
    
            // Guardar el token de acceso en AsyncStorage
            await AsyncStorage.setItem('supabaseToken', session.access_token);
    
            // Guardar otros datos relevantes (opcional)
            // Por ejemplo, puedes guardar el nombre del usuario
            await AsyncStorage.setItem('userName', user.email);
            await AsyncStorage.setItem('UserId', user.id);
    
            // Dispatch de la acción de login
            dispatch(login({ name: user.email, uid: user.id }));
    
        } catch (error) {
            dispatch(logout('Error de autenticacion'))
            setTimeout(() => {
                dispatch(clearErrorMessage())
            }, 10)

          await AsyncStorage.removeItem('supabaseToken');
            console.error('Error during login:', error);
            Alert.alert('An error occurred during login. Please try again later.');
        }
    }

    const checkAuthToken = async () => {
        try {
            // Obtener el token de acceso almacenado en AsyncStorage
            const token = await AsyncStorage.getItem('supabaseToken');
            // Verificar si el token está presente
            if (!token) {
                // Si el token no está presente, realizar acciones de logout
                dispatch(logout());
                await AsyncStorage.removeItem('supabaseToken');
                await AsyncStorage.removeItem('userName');
                await AsyncStorage.removeItem('UserId');
                return;
            } 

            const username = await AsyncStorage.getItem('userName');
            const uid = await AsyncStorage.getItem('UserId');
            dispatch(login({ name: username, uid: uid }));
            
        } catch (error) {
            // Manejar cualquier error que pueda ocurrir durante el proceso
            console.error('Error during token verification:', error);
            // Realizar acciones de logout en caso de error
            await AsyncStorage.clear();
            dispatch(logout());
        }
    };
    

    const startLogout = async() =>{
        try {
            const  error  = await supabase.auth.signOut()
            dispatch(logout())
            dispatch(onLogoutIncident())
            await AsyncStorage.removeItem('supabaseToken');
            await AsyncStorage.removeItem('userName');
            await AsyncStorage.removeItem('UserId');
            console.log(error);
        } catch (error) {
            console.log(error);
        }
    }

  return {

    status,
    data_auth,
    startLogin,
    checkAuthToken,
    startLogout,

  }
}
