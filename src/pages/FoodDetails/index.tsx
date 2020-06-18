import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const url = `foods/${routeParams.id}`;

      const { data } = await api.get<Food>(url);

      const formattedFood = {
        ...data,
        formattedPrice: formatValue(data.price),
      } as Food;

      setFood(formattedFood);

      const foodExtras = data.extras.map(
        extra => ({ ...extra, quantity: 0 } as Extra),
      );

      setExtras(foodExtras);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const updatedAmount = extras.map(extra =>
      id === extra.id ? { ...extra, quantity: extra.quantity + 1 } : extra,
    );

    setExtras(updatedAmount);
  }

  function handleDecrementExtra(id: number): void {
    const updatedAmount = extras.map(extra => {
      if (extra.id === id && extra.quantity) {
        return { ...extra, quantity: extra.quantity - 1 } as Extra;
      }
      return extra;
    });

    setExtras(updatedAmount);
  }

  function handleIncrementFood(): void {
    setFoodQuantity(state => state + 1);
  }

  function handleDecrementFood(): void {
    setFoodQuantity(state => (state > 1 ? state - 1 : state));
  }

  const toggleFavorite = useCallback(() => {
    async function removeFavoriteFood(id: number): Promise<void> {
      const url = `favorites/${id}`;
      await api.delete(url);
      setIsFavorite(false);
    }

    async function addFavoriteFood(): Promise<void> {
      const resource = 'favorites';
      const requestBody = { data: food };
      await api.post(resource, requestBody);
      setIsFavorite(true);
    }
    // Toggle if food is favorite or not
    if (isFavorite) {
      removeFavoriteFood(food.id);
    }

    addFavoriteFood();
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const amountPriceExtras = extras.reduce((amount, extra) => {
      const amountExtraPrice = extra.quantity * extra.value;
      return amount + amountExtraPrice;
    }, 0);

    const amountOrderValue = foodQuantity * (food.price + amountPriceExtras);

    return formatValue(amountOrderValue);
  }, [extras, food, foodQuantity]);

  const handleFinishOrder = useCallback(async () => {
    // Finish the order and save on the API
    const resource = 'orders';
    const orderData = { ...food, extras } as Omit<Food, 'formattedPrice'>;
    const requestBody = { data: orderData };
    await api.post(resource, requestBody);

    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    });
  }, [extras, food, navigation]);

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
