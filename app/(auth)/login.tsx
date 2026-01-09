import { View, Text, TextInput, Button } from 'react-native';
import { useState, useContext } from 'react';
import { login } from "../../src/services/auth.service";
import { AuthContext } from '../../src/context/auth';
import { router } from "expo-router";

export default function Login() {
    const { loginUser } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPasword] = useState('');

    const handleLogin = async () => {
        const user = await login({ email, password });
        loginUser(user);
        router.replace('/(tabs)');
    }


    return (
        <View style={{ padding: 20 }}>
            <Text>Login</Text>

            <TextInput
                placeholder='Email'
                value={email}
                onChangeText={setEmail}
            />

            <TextInput
                placeholder='Password'
                value={password}
                onChangeText={setPasword}
                secureTextEntry
            />

            <Button title="Login" onPress={handleLogin} />
            <Button title="Go to Register" onPress={() => router.push('/(auth)/register')} />
        </View>
    )
}