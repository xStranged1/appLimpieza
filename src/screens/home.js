import React, {useEffect, useState} from 'react';
import { Text, SafeAreaView, TextInput, TouchableOpacity, Alert, View, ScrollView, SectionList } from 'react-native';
import { doc, setDoc, getFirestore, collection, orderBy, onSnapshot, query, where, serverTimestamp, updateDoc } from "firebase/firestore"; // Follow this pattern to import other Firebase services
import { getAuth, signOut} from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import firebaseConfig from '../firebase-config';
import styles from '../screens/stylesScreens';
import { Checkbox, Colors } from 'react-native-paper';
import Button from '../components/Button';
import IconLogOut from '../components/IconLogOut'

console.log('setea contador -1');
let contador = -1;
 
export default function HomeScreen({navigation, route}) {

    console.log('render HomeScreen');
    contador =-1;
    const auth = getAuth(app);
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const [sectors, setSectors ] = useState([]);
    const [user, setUser ] = useState([]);
    const [activeTasks, setActiveTasks ] = useState([]);
    const [markedTasks, setMarkedTasks ] = useState([]);
    const [checkList, setCheckList] = useState([]);
    const [controlCheckList, setControlCheckList] = useState([]);
    const [canCheckTask, setCanCheckTask ] = useState(false);
    const [canCheckControlTask, setCanCheckControlTask ] = useState(false);


    const [checked, setChecked] = useState([]);
    

    const DATA = [
      {
        title: "Main dishes",
        data: ["Pizza", "Burger", "Risotto"]
      },
      {
        title: "Sides",
        data: ["French Fries", "Onion Rings", "Fried Shrimps"]
      },
      {
        title: "Drinks",
        data: ["Water", "Coke", "Beer"]
      },
      {
        title: "Desserts",
        data: ["Cheese Cake", "Ice Cream"]
      }
    ];

  const irACrearSector = () =>{
    if (route.params.uid == 'UDUaYCyuVJYCTP7Y21DJ7ylD8aO2'){
      console.log('Estamos ante el creador');
      navigation.navigate('AddSector', {uid: route.params.uid});
    }
    else alert('solo admin');
  }

const logActiveTasks = () => {
  activeTasks.forEach(element => {
    let active_tasks = element.active_tasks;
    active_tasks.forEach(task => {
      console.log('sector: '+task.sector);
      task.data.forEach(task => {
      console.log('tarea: '+task);
      });
    });
  });
}


const handleControlCheck = async (i) => {

  
}

const handleCheck = async (i) => {

  let check = checkList;
  if (check.length>0){
    if (check[i]=='unchecked'){
      check[i] = 'checked';
    }else{
      check[i] = 'unchecked';
    }
  }
  setCheckList(check);

          //Add markedTask
          await updateDoc(doc(db, 'assigned_tasks', route.params.uidTask), {
            markedTask: check,
            timeStampMarkedTask: serverTimestamp(),
          });
  
}
const renderAssignedTasks = ({ item }) =>{
  
  
  contador++;
  if (contador>=checkList.length){
    console.log('contador: '+contador+'>= ntareas: '+checkList.length);
    contador = 0;
  }
  let checkIndex = 0;

  //  si no hay checklist, la setea unchecked
  if (checkList.length == 0){
    console.log('check vacio, set unchecked');
    activeTasks.forEach(s => {
      s.data.forEach(task => {
      checkList[checkIndex]='unchecked';
      checkIndex++;
      });
    });
    checkIndex = 0;
  }
  if (controlCheckList.length == 0){
    console.log('controlCheckList vacio, set unchecked');
    activeTasks.forEach(s => {
      s.data.forEach(task => {
        controlCheckList[checkIndex]='unchecked';
      checkIndex++;
      });
    });
  }
  let i = contador
  console.log('render: '+item+' index: '+i);

  return (
    <View style = {styles.viewSeccion}>
      <View>
        <Item title={item} />
      </View>
      <View style={{ flex: 1 }} />
      <View style = {{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
        <Text>{i+1}</Text>

        {/* user checkbox */}
        <Checkbox
        disabled = {!canCheckTask}
        status = {checkList[i]}
        onPress={() =>{
          handleCheck(i);
          if (checked=='unchecked'){
            setChecked('checked');
          }else{
            setChecked('unchecked');
          }
        }}
        />

{/* control checkbox */}
<Checkbox
        color='#39ff14'
        status={controlCheckList[i]}
        disabled = {!canCheckControlTask}
        onPress={() =>{
          handleControlCheck(i);
          if (checked=='unchecked'){
            setChecked('checked');
          }else{
            setChecked('unchecked');
          }
        }}
        />
      </View>

    </View>
  )
}
    const logOut = () =>{
      signOut(auth).then(() => {
        alert('Session cerrada');
        navigation.navigate('Iniciar Sesion');
      }).catch((error) => {
        alert(error);
      });
    }
    
    const Item = ({ title }) => (
      <View style={styles.itemSectionlist}>
        <Text style={styles.titleSectionlist}>{title}</Text>
      </View>
    );


    useEffect(() => {

      if (route.params.uid == route.params.uidTask){
        //Es el usuario viendo sus tareas
        setCanCheckTask(true);
      }else{
        setCanCheckTask(false);
      }
      let q;
      let unsuscribe;
      let collectionRef = collection(db, 'sectors');
      q = query(collectionRef, orderBy('sector_name', 'asc'))

      unsuscribe = onSnapshot(q, querySnapshot =>{
        setSectors(
          querySnapshot.docs.map(doc =>({
            key: doc.data().sector_name,
            sector_description: doc.data().sector_description,
          }))
        )
      })


      let u;
      collectionRef = collection(db, 'user');
      q = query(collectionRef, where("uid", "==", route.params.uid))
      unsuscribe = onSnapshot(q, querySnapshot =>{
      u = (
        querySnapshot.docs.map(doc =>({
          name: doc.data().username,
        }))
      )

      u.forEach(element => {
        console.log('u: '+element.name);
        setUser(element.name)
      });
      
    })


    collectionRef = collection(db, 'assigned_tasks');
  
    q = query(collectionRef, where("uid", "==", route.params.uidTask))

    unsuscribe = onSnapshot(q, querySnapshot =>{
      let qAssigned_tasks = (
        querySnapshot.docs.map(doc =>({
          timestamp: doc.data().timestamp,
          uid: doc.data().uid,
          active_tasks: doc.data().active_tasks,
          markedTask: doc.data().markedTask,
        }))
      )

      let activeTasks = [];
      let markedTask = [];
      qAssigned_tasks.forEach(element => {
        activeTasks = element.active_tasks;
        markedTask = element.markedTask
        if (markedTask){
          console.log('se encontraron tareas marcadas');
          setCheckList(markedTask);
        }
      });
      setActiveTasks(activeTasks);

    })

  

      auth.onAuthStateChanged((user) => {
        if (user) {
          console.log("ya tienes sesi??n iniciada con:"+route.params.uid); 
      }
      return unsuscribe;
      });
    }, [route], [checkList]);
  


    // Return HomeScreen
    return (
      
      <SafeAreaView style = {styles.container}>
        <View style = {{flexDirection: 'row'}}>
        

        <View style={styles.viewHeader}>
              <View style = {styles.btnHeader}>
                <Text style = {styles.textHeader}>Sesi??n: {user} </Text>
              </View>
        </View>


          <View style={styles.viewHeader}>

            
            <TouchableOpacity onPress={() => navigation.navigate('Usuarios', {uid: route.params.uid})}
            style = {styles.btnHeader}>
                <Text style = {styles.textHeader}>USUARIOS</Text>
            </TouchableOpacity>
            
          </View>
          
          <View style={styles.viewHeader}>
            <TouchableOpacity onPress={() => navigation.navigate('Asignar Tarea', {uid: route.params.uid})}
            style = {styles.btnHeader}>
              <Text style = {styles.textHeader} >ASIGNAR TAREAS</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.viewLogOut}>
            <TouchableOpacity onPress={logOut}>
              <IconLogOut/>
            </TouchableOpacity>  
          </View>
          
        </View>
        
        <View style = {{
          flex: 1,
          backgroundColor: '#cdcdcd',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80%',
          }}>
          
        

            <View style = {{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center',}}>
              <Text style = {styles.titleHeader}>Hola {user} !</Text>
            </View>

          
          
          <TouchableOpacity onPress={()=> {navigation.navigate('Tasks', {uid: route.params.uid})}}>
            <Text>Ir a Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=> {navigation.navigate('Agregar Tarea', {uid: route.params.uid})}}>
            <Text>Ir a Crear tareas</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={irACrearSector}>
            <Text>Ir a Crear Sector</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={()=> {navigation.navigate('Usuarios', {uid: route.params.uid})}}>
            <Text>Ir a Usuarios</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={logActiveTasks}>
            <Text>Ver tareas activas</Text>
          </TouchableOpacity>

            <View style = {{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center',}}>
              <Text style = {styles.subtitleSection}>Tareas asignadas esta semana: {checkList.length} </Text>
            </View>
      <View style = {{height: "60%"}}>

          <SectionList
          sections={activeTasks}
          renderItem={renderAssignedTasks}
          renderSectionHeader={({ section: { sector } }) => (
            <Text style={styles.SectionHeader}>{sector}</Text>
          )}
        />
          
      </View>

      </View>

      </SafeAreaView>
    )
    }