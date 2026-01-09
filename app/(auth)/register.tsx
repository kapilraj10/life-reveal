import { View, Text, TextInput, Button } from "react-native";
import { useState, useContext } from "react";
import { register } from "../../src/services/auth.service";
import { AuthContext } from "../../src/context/auth";
import { router } from "expo-router";

export default function Register() {
  const { loginUser } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    const user = await register({ name, email, password });
    loginUser(user);
    router.replace("/(tabs)");
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Register</Text>

      <TextInput placeholder="Name" value={name} onChangeText={setName} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}
