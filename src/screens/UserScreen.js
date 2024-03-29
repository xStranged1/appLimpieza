import React, { memo, useEffect, useState } from "react";
import { StyleSheet, Text, SafeAreaView, TextInput, TouchableOpacity, View, Alert, ScrollView, Image } from "react-native";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, querySnapshot, getDocs, orderBy, onSnapshot, QuerySnapshot, where, updateDoc, doc } from "firebase/firestore";
import firebaseConfig from "../firebase-config";
import styles from "../screens/stylesScreens";

export default function TaskScreen({ navigation, route }) {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const [user, setUser] = useState([]); //user who see their own tasks
  const [users, setUsers] = useState([]); //all the users
  const [usersInHome, setUsersInHome] = useState([]);
  const [usersOutHome, setUsersOutHome] = useState([]);
  const [sectors, setSectors] = useState([]); //all sectors
  
  
  const changeOnHome = async (uid, inHome) =>{
    console.log('uid: '+ uid);
    await updateDoc(doc(db, "user", uid), {
      in_home: !inHome,
    });
  }
  const CircleYellow = memo(() => (
    <View style={{marginLeft: 12}}>
      <Image
        style={{ width: 11, height: 11 }}
        source={require("../assets/circle-yellow.png")}
      />
    </View>
  ));
  const CircleBlue = memo(() => (
    <View style={{marginLeft: 12}}>
      <Image
        style={{ width: 11, height: 11 }}
        source={require("../assets/circle-blue.png")}
      />
    </View>
  ));
  const CircleGreen = memo(() => (
    <View style={{marginLeft: 12}}>
      <Image
        style={{ width: 11, height: 11 }}
        source={require("../assets/circle-green.png")}
      />
    </View>
  ));


  const State = (props) => {
    let state = props.state
    if (state == 'finished'){ //admin marked all tasks completed
      return (<CircleGreen/>)
    }else if (state == 'completed'){ //user marked one or more as completed
      return (<CircleBlue/>)
    }else if (state == 'active'){ //have a tasks assigned without checks
      return (<CircleYellow/>)
    } //else the user don't have assigned tasks
   
  }
  
  const ListItem = (props) => {
    let sectors = props.sectors
    return (
      <SafeAreaView>
        <TouchableOpacity
          style={styles.btnUsuario}

          onPress = {() => {
            navigation.navigate("appLimpieza", {
              uid: route.params.uid,
              uidTask: props.uid,
              fromUserScreen: true,
            });
          }}

          onLongPress = {() => {
            
            if(route.params.canControl){
              changeOnHome(props.uid, props.inHome)
            }
          }}
        >
          <View style={{ justifyContent: "center", alignItems: "center", marginRight: 15}}>
            <View style={{ flex: 1, flexDirection: "row"}}>
              <View style={{ alignSelf: "center"}}>
                <Text style={styles.txtUser}>{props.value}</Text>
              </View>
              <View style={styles.circle}>
                <State state={props.states}/>
              </View>
            </View>
          {sectors && (sectors.map(sector => (
            <Text style={styles.pSector}> {sector}</Text>
          )))}
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const SectorList = (props) => {


    let users = props.users

    let namesInHome = []
    let UidsInHome = []
    let sectorsInHome = []
    let statesInHome = []
    
    let statesOutHome = []
    let namesOutHome = []
    let UidsOutHome = []
    let sectorsOutHome = []

    if (users != "") {
      let indexInHome = 0
      let indexOutHome = 0

      users.forEach((user) => {
        if(user.in_home){
          namesInHome[indexInHome] = user.username
          UidsInHome[indexInHome] = user.uid
          sectorsInHome[indexInHome] = user.sectors
          statesInHome[indexInHome] = user.state
          indexInHome++
        }else{
          namesOutHome[indexOutHome] = user.username
          UidsOutHome[indexOutHome] = user.uid
          sectorsOutHome[indexOutHome] = user.sectors
          statesOutHome[indexOutHome] = user.state
          indexOutHome++
        }
      });
      let cantUsersInhome = namesInHome.length
      let cantUsersOuthome = namesOutHome.length

      return (
        <View>
          {cantUsersInhome>0 && <Text style={styles.inHouseTitle}>En casa</Text>}
          {cantUsersInhome==0 && <Text style={styles.inHouseTitle}>No hay usuarios en casa</Text>}
          <Text>
            {namesInHome.map((nombre, i) => (
              <ListItem
                key={nombre.toString()}
                value={nombre}
                inHome={true}
                uid={UidsInHome[i]}
                sectors={sectorsInHome[i]}
                states={statesInHome[i]}
              />
            ))}
          </Text>

          
          {cantUsersOuthome>0 && <Text style={styles.inHouseTitle}>Fuera de casa</Text>}
          {cantUsersOuthome==0 && <Text style={styles.inHouseTitle}>No hay usuarios fuera de casa</Text>}

          <Text>
            {namesOutHome.map((nombre, i) => (
              <ListItem
                key={nombre.toString()}
                value={nombre}
                inHome={false}
                uid={UidsOutHome[i]}
                sectors={sectorsOutHome[i]}
                states={statesOutHome[i]}
              />
            ))}
          </Text>
        </View>
      );
    } else {
      console.log("no hay usuarios");
    }
  };

  useEffect(() => {


    let collectionRef = collection(db, "assigned_tasks");
    let q = query(collectionRef);
    let assignedTasks = []
    // get assigned_tasks
    let unsuscribe = onSnapshot(q, (querySnapshot) => {
      assignedTasks = (
        querySnapshot.docs.map((doc) => ({
          uid: doc.data().uid,
          active_tasks: doc.data().active_tasks,
          control_marked_tasks: doc.data().control_marked_tasks,
          marked_tasks: doc.data().marked_tasks,
        }))
      );
    });

    //set my username
    let u;
    collectionRef = collection(db, "user");
    q = query(collectionRef, where("uid", "==", route.params.uid));
    unsuscribe = onSnapshot(q, (querySnapshot) => {
      u = querySnapshot.docs.map((doc) => ({
        name: doc.data().username,
      }));

      u.forEach((element) => {
        setUser(element.name);
      });
    });

    //set users
    collectionRef = collection(db, "user");
    q = query(collectionRef);
    unsuscribe = onSnapshot(q, (querySnapshot) => {
      u = querySnapshot.docs.map((doc) => ({
        in_home: doc.data().in_home,
        username: doc.data().username,
        uid: doc.data().uid,
        canControl: doc.data().can_control,
        sectors: [],
      }));

      


      const getState = (marked, control, haveTasks) => {
        if(!haveTasks) return('none')

        let haveAllControlCheck = true;
        let i = 0
        while (haveAllControlCheck && i < control.length) {
          if (control[i] == 'unchecked'){
            haveAllControlCheck = false
          }
          i++
        }
        if (haveAllControlCheck){
          return('finished')
        }else{
        let haveSomeCheck = false;
        let j = 0
        while (!haveSomeCheck && j < marked.length) {
          if (marked[j] == 'checked'){ // if have one or more tasks mark as completed
            haveSomeCheck = true
          }
          j++
        }
        if (haveSomeCheck){
          return('completed')
        }else{
          return('active')
        }
      }
    }
    
      u.forEach((user, i) => { //binding sectors to users
        let uid = user.uid
        let sectors = []
          assignedTasks.forEach(assignedTask => {
            let uidAssignedTask = assignedTask.uid
            let haveTasks = false
            if (uid == uidAssignedTask){
              let activeTasks = assignedTask.active_tasks
              let control = assignedTask.control_marked_tasks
              let marked = assignedTask.marked_tasks
              if(activeTasks){
                haveTasks = true
                activeTasks.forEach(sector => {
                  sectors.push(sector.sector)
                });
                
                let stateGet = getState(marked, control, haveTasks);
                user.state = stateGet
                user.sectors = sectors
              }else{
                user.state = 'none'
                user.sectors = ['No tiene tareas asignadas']
              }
            }

          });
      });

      

      let usersInHome = [];
      let usersOutHome = [];
      u.forEach(user => {
        if (user.in_home){
          usersInHome.push(user)
        }
        if (user.in_home == false){
          usersOutHome.push(user)
        }
      });
      setUsersOutHome(usersOutHome)
      setUsersInHome(usersInHome)
      setUsers(u);
    });

    return unsuscribe;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              width: "90%",
              height: "90%"
            }}
          >
        <ScrollView>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 5,
                  marginTop: 16,
                }}
              >
                <Text style={styles.subtitleSection}>
                  {" "}
                  Ver tareas asignadas de los usuarios:
                </Text>
              </View>
            <SectorList users={users} />

      </ScrollView>

          </View>
    </SafeAreaView>
  );
}
